use iso2god::executable::TitleInfo;
use iso2god::god::{ContentType, HashList};
use iso2god::{game_list, god, iso};
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::{Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::thread;
use log::info;
use serde_repr::{Deserialize_repr, Serialize_repr};
use tauri::{Emitter, Error};

#[derive(Serialize_repr, Deserialize_repr, Clone, Debug, PartialEq)]
#[repr(u16)]
pub enum Padding {
    Untouched,
    Partial,
    RemoveAll
}

#[derive(Serialize_repr, Deserialize_repr, Clone, Debug)]
#[repr(u16)]
pub enum Format {
    God,
    GodAndIso,
    Iso
}

#[derive(Serialize_repr, Deserialize_repr, Clone, Debug)]
#[repr(u16)]
pub enum GODLayout {
    TitleId,
    Name,
    NameSlashTitleId,
    NameDashTitleId,
}

#[derive(Serialize_repr, Deserialize_repr, Clone, Debug)]
#[repr(u16)]
pub enum Platform {
    Xbox360,
    Xbox
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IsoGame {
    id: String,
    path: String,
    title: String,
    content_type: String,
    media_id: String,
    disc_number: u8,
    disc_count: u8,
    platform: u8,
    executable_type: u8,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OutputOptions {
    format: Format,
    auto_rename: bool,
    god_layout: GODLayout,
    padding: Padding
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Disc {
    current: u8,
    total: u8,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TitleDetails {
    name: String,
    title_id: String,
    media_id: String,
    disc: Disc,
    platform: Platform,
    executable_type: u8,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Iso {
    source: String,
    god_path: String,
    iso_path: String,
    title_details: TitleDetails,
    output_options: OutputOptions,
}

#[derive(Clone, serde::Serialize)]
struct Progress {
    source: String,
    progress: f64,
}

static CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

fn report_progress(app: &tauri::AppHandle, source: &str, progress: f64) {
    if CANCEL_FLAG.load(Ordering::Relaxed) { return; }
    app.emit("progress-report", Progress { source: source.to_string(), progress }).unwrap();
}

#[tauri::command]
fn cancel() {
    info!("Canceling conversion...");
    CANCEL_FLAG.store(true, Ordering::Relaxed);
}

fn convert_iso(app: &tauri::AppHandle, iso: Iso) {
    let mut progress = 5.0;
    let source_iso_file = File::open(&iso.source).expect("Failed to open the ISO file");
    
    let source_iso_file_meta =
        fs::metadata(&iso.source).expect("Error reading source ISO file metadata");

    let mut source_iso =
        iso::IsoReader::read(source_iso_file).expect("Error reading source ISO");

    report_progress(app, &iso.source, progress);

    let title_info =
        TitleInfo::from_image(&mut source_iso).expect("Error reading image executable");

    let exe_info = title_info.execution_info;
    let content_type = title_info.content_type;

    let data_size = if iso.output_options.padding == Padding::Partial {
        source_iso.get_max_used_prefix_size()
    } else {
        let root_offset = source_iso.volume_descriptor.root_offset;
        source_iso_file_meta.len() - root_offset
    };
        
    let block_count = data_size.div_ceil(god::BLOCK_SIZE);
    let part_count = block_count.div_ceil(god::BLOCKS_PER_PART);

    let output_path = PathBuf::from(&iso.god_path);
    let file_layout = god::FileLayout::new(&output_path, &exe_info, content_type);

    progress += 10.0;
    report_progress(app, &iso.source, progress);

    if CANCEL_FLAG.load(Ordering::Relaxed) {
        return;
    }

    ensure_empty_dir(&file_layout.data_dir_path()).expect("Error clearing data directory");

    progress += 5.0;
    report_progress(app, &iso.source, 20.0);
    

    let part_progress = AtomicUsize::new(0);
    let progress_per_part = 30.0 / part_count as f64;

    if CANCEL_FLAG.load(Ordering::Relaxed) {
        return;
    }

    (0..part_count).into_iter().try_for_each(|part_index| {
        if CANCEL_FLAG.load(Ordering::Relaxed) {
            return Ok(());
        }
        
        info!("Writing Part {} of {}", part_index + 1, part_count);
        let mut iso_data_volume = File::open(&iso.source)?;
        iso_data_volume.seek(SeekFrom::Start(source_iso.volume_descriptor.root_offset))?;

        let part_file = file_layout.part_file_path(part_index);

        let part_file = File::options()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&part_file)
            .expect("Error creating part file");

        god::write_part(iso_data_volume, part_index, part_file)
            .expect("Error writing part file");

        part_progress.fetch_add(1, Ordering::Relaxed);

        progress += progress_per_part;
        report_progress(app, &iso.source, progress);
        
        Ok::<_, Error>(())
    }).expect("Error during partitioning");

    if CANCEL_FLAG.load(Ordering::Relaxed) {
        return;
    }

    progress += 10.0;
    let mut mht =
        read_part_mht(&file_layout, part_count - 1).expect("error reading part file MHT");

    report_progress(app, &iso.source, progress);
    if CANCEL_FLAG.load(Ordering::Relaxed) {
        return;
    }

    let progress_per_part = 10.0 / (part_count - 1) as f64;
    for prev_part_index in (0..part_count - 1).rev() {
        if CANCEL_FLAG.load(Ordering::Relaxed) {
            return;
        }

        let mut prev_mht =
            read_part_mht(&file_layout, prev_part_index).expect("error reading part file MHT");

        prev_mht.add_hash(&mht.digest());

        write_part_mht(&file_layout, prev_part_index, &prev_mht)
            .expect("error writing part file MHT");

        mht = prev_mht;
        
        progress += progress_per_part;
        report_progress(app, &iso.source, progress);
    }

    let last_part_size = fs::metadata(file_layout.part_file_path(part_count - 1))
        .map(|m| m.len())
        .expect("Error reading part file");

    progress += 5.0;
    report_progress(app, &iso.source, progress);
    info!("writing con header");

    if CANCEL_FLAG.load(Ordering::Relaxed) {
        return;
    }
    let mut con_header = god::ConHeaderBuilder::new()
        .with_execution_info(&exe_info)
        .with_block_counts(block_count as u32, 0)
        .with_data_parts_info(
            part_count as u32,
            last_part_size + (part_count - 1) * god::BLOCK_SIZE * 0xa290,
        )
        .with_content_type(content_type)
        .with_mht_hash(&mht.digest());

    con_header = con_header.with_game_title(&iso.title_details.name);

    let con_header = con_header.finalize();

    progress += 15.0;
    report_progress(app, &iso.source, progress);
    if CANCEL_FLAG.load(Ordering::Relaxed) {
        return;
    }

    let mut con_header_file = File::options()
        .write(true)
        .create(true)
        .truncate(true)
        .open(file_layout.con_header_file_path())
        .expect("cannot open con header file");

    con_header_file
        .write_all(&con_header)
        .expect("error writing con header file");

    progress += 10.0;
    report_progress(app, &iso.source, progress);
    
    info!("done");
}

fn read_part_mht(file_layout: &god::FileLayout, part_index: u64) -> Result<HashList, anyhow::Error> {
    let part_file = file_layout.part_file_path(part_index);
    let test = &part_file.as_path().as_os_str().to_str().unwrap();
    info!("reading part file: {part_index} {test}");
    let mut part_file = File::options().read(true).open(part_file)?;
    god::HashList::read(&mut part_file)
}

fn write_part_mht(
    file_layout: &god::FileLayout,
    part_index: u64,
    mht: &god::HashList,
) -> Result<(), Error> {
    let part_file = file_layout.part_file_path(part_index);
    let mut part_file = File::options().write(true).open(part_file)?;
    mht.write(&mut part_file)?;
    Ok(())
}

fn ensure_empty_dir(path: &Path) -> Result<(), Error> {
    if fs::exists(path)? {
        fs::remove_dir_all(path)?;
    };
    fs::create_dir_all(path)?;
    Ok(())
}

#[tauri::command]
async fn convert(app_handle: tauri::AppHandle, isos: Vec<Iso>) -> Result<(), Error> {
    CANCEL_FLAG.store(false, Ordering::Relaxed);
    let mut threads = vec![];

    for iso in isos {
        let app_handle = app_handle.clone();
        threads.push(thread::spawn(move || {
           convert_iso(&app_handle, iso)
        }))
    }


    let _: Vec<_>  = threads.into_iter().map(|h| h.join().unwrap()).collect();

    if CANCEL_FLAG.load(Ordering::Relaxed) {
        return Err(Error::Io(std::io::Error::new(
            std::io::ErrorKind::Interrupted,
            "Conversion was canceled",
        )));
    }

    Ok(())
}

#[tauri::command]
fn read_iso(path: &str) -> IsoGame {
    let source_file = File::open(path).expect("Failed to open the ISO file");
    let mut source_iso = iso::IsoReader::read(source_file).expect("Failed to read ISO file");
    let title_info = TitleInfo::from_image(&mut source_iso).expect("Failed to read TitleInfo");
    let exe_info = title_info.execution_info;

    let title_id = format!("{:08X}", exe_info.title_id);
    let media_id = format!("{:08X}", exe_info.media_id);
    let name =
        game_list::find_title_by_id(exe_info.title_id).expect("Failed to find the title by id");
    let content_type = match title_info.content_type {
        ContentType::GamesOnDemand => "Games on Demand",
        ContentType::XboxOriginal => "Xbox Original",
    };

    IsoGame {
        id: title_id,
        path: path.to_string(),
        title: name,
        content_type: content_type.to_string(),
        media_id,
        disc_count: exe_info.disc_count,
        disc_number: exe_info.disc_number,
        platform: exe_info.platform,
        executable_type: exe_info.executable_type,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new()
            .targets([
                tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ),
                tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ),
            ])
            .format(|out, message, record| {
                out.finish(format_args!(
                    "[{} {}] {}",
                    record.level(),
                    record.target(),
                    message
                ))
            })
            .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
            .level(log::LevelFilter::Info)
            .build())
        .invoke_handler(tauri::generate_handler![convert, read_iso, cancel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
