import Panel from "../components/Panel.tsx";
import {
  Format,
  FORMAT_TO_LABEL,
  GOD_LAYOUT_TO_LABEL,
  GODLayout,
  IsoInfo,
  Padding,
  PADDING_TO_LABEL, Platform, PLATFORM_TO_LABEL
} from "../Interfaces.ts";
import {Window} from "@tauri-apps/api/window";
import {createEffect, createSignal, onCleanup} from "solid-js";
import {invoke} from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import Button from "../components/Button.tsx";

interface IsoGame {
  id: string,
  path: string,
  title: string,
  contentType: string,
  mediaId: string,
  discNumber: number,
  discCount: number,
  platform: Platform,
  executableType: number
}

interface IsoSelectedEvent {
  path: string
}

const SelectIsoScreen = () =>{
  const [payload, setPayload] = createSignal<IsoInfo>({
    source: "",
    godPath: "",
    isoPath: "",
    titleDetails: {
      name: "",
      titleId: "",
      mediaId: "",
      disc: {
        current: 0,
        total: 0
      },
      platform: Platform.XBOX360,
      executableType: 0
    },
    outputOptions: {
      format: Format.GOD,
      autoRename: false,
      godLayout: GODLayout.TITLE_ID,
      padding: Padding.UNTOUCHED
    }
  });

  createEffect(async () => {
    const windows = await Window.getByLabel("select-iso");
    windows?.emit("iso-page-ready")
  })

  createEffect(async () => {
    const unlisten = await (await Window.getByLabel("select-iso"))?.listen<IsoSelectedEvent>(
      "iso-selected", (event) => {
        parseIso(event.payload.path)
      });

    onCleanup(() => {
      unlisten?.()
    })
  })

  const save = async () => {
    if (!payload().source) {
      alert("Please select an ISO file.");
      return;
    } else if (!payload().godPath) {
      alert("Please select an output folder.");
      return;
    } else if (!payload().titleDetails.name) {
      alert("Please enter a title name.");
      return;
    }

    const window = await Window.getByLabel("select-iso");
    if (!window) { throw new Error("Select Iso window not does not exist!"); }
    await window.emit("save", payload())
  }

  const parseIso = async (path: string) => {
    const response = await invoke<IsoGame>("read_iso", { path })
    setPayload((prev) => ({
      ...prev,
      source: response.path,
      titleDetails: {
        ...prev.titleDetails,
        name: response.title,
        titleId: response.id,
        mediaId: response.mediaId,
        disc: {
          current: response.discNumber,
          total: response.discCount
        },
        platform: response.platform,
        executableType: response.executableType
      }
    }))
  }

  const selectIso = async () => {
    const file = await open({
      multiple: false,
      directory: false,
      filters: [{
        name: "ISO Files",
        extensions: ["iso"]
      }]
    });

    if (!file) { return; }

    await parseIso(file)
  }

  const selectOutput = async () => {
    const folder = await open({
      multiple: false,
      directory: true,
    });

    if (!folder) { return; }

    setPayload((prev) => ({
      ...prev,
      godPath: folder,
    }))
  }

  return <>
    <main class="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen space-y-4">
      <Panel label={"Source"}>
        <label for="iso-source-path" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">ISO Path</label>
        <div class="flex w-full bg-gray-50 rounded-md dark:bg-gray-700">
          <input
            value={payload().source}
            onChange={(e) => setPayload((old) => ({...old, isoPath: e.target.value}))}
            id="iso-source-path"
            class="w-full rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="/home/foo/bar.iso"
            type={"text"}
          />
          <Button variant="ghost" class="rounded-l-none" type="button" onclick={selectIso}>Browse</Button>
        </div>
      </Panel>
      <Panel label={"Output"} class="mt-4">
        <div>
          <label for="god-path" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">GOD Path</label>
          <div class="flex rounded-md bg-gray-50 dark:bg-gray-700">
            <input value={payload().godPath} onChange={(e) => setPayload((old) => ({...old, godPath: e.target.value}))} id="god-path" class="w-full rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-50 text-sm px-3 py-2 focus:outline-none focus:ring-2 dark:bg-gray-700" placeholder="/home/foo/" type={"text"}/>
            <Button variant="ghost" class="rounded-l-none" onclick={selectOutput} type="button">Browse</Button>
          </div>
        </div>
        <div class="mt-2">
          <label for="trim" class="text-sm select-none flex items-center text-gray-700 dark:text-gray-200">
            <input id="trim" type="checkbox" class="ml-1 mr-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" checked={payload().outputOptions.padding === Padding.PARTIAL} onChange={(e) => {
              setPayload((old) => ({
                ...old,
                outputOptions: {
                  ...old.outputOptions,
                  padding: e.currentTarget.checked ? Padding.PARTIAL : Padding.UNTOUCHED,
                }
              }))
            }}/>
            Trim
          </label>
        </div>
        <div class="mt-2 hidden">
          <label for="iso-path" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">ISO Path</label>
          <div class="flex">
            <input id="iso-path" class="w-full rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="/home/foo/out.iso" type={"text"}/>
            <Button variant="secondary" class="rounded-l-none" type="button">Browse</Button>
          </div>
        </div>
      </Panel>
      <Panel class="mt-4" label={"Title Details"}>
        <div>
          <label for="name" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Name</label>
          <input value={payload().titleDetails.name} onChange={(e) => setPayload((old) => ({...old, titleDetails: {...old.titleDetails, name: e.target.value}}))} id="name" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2" placeholder="Halo 3" type={"text"}/>
        </div>
        <div class="mt-2">
          <label for="title-id" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Title ID</label>
          <input value={payload().titleDetails.titleId} readonly id="title-id" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2" placeholder="4D5307E6" type={"text"}/>
        </div>
        <div class="mt-2">
          <label for="media-id" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Media ID</label>
          <input value={payload().titleDetails.mediaId} readonly id="media-id" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2" placeholder="699E0227" type={"text"}/>
        </div>
        <div class="mt-2">
          <label for="disc-current" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Disc</label>
          <div class="flex items-center">
            <input value={payload().titleDetails.disc.current} readonly min={1} id="disc-current" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2" placeholder="1" type={"number"}/>
            <span class="font-bold px-2 text-gray-500 dark:text-gray-400">/</span>
            <input value={payload().titleDetails.disc.total} readonly min={1} id="disc-total" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2" placeholder="2" type={"number"}/>
          </div>
        </div>
        <div class="mt-2 w-full">
          <div class="flex items-center gap-2 w-full">
            <div class="flex flex-col w-full">
              <label for="plat" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Platform</label>
              <input value={PLATFORM_TO_LABEL[payload().titleDetails.platform]} readonly id="plat" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2" placeholder="0"/>
            </div>
            <div class="flex flex-col w-full">
              <label for="ex" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Ex</label>
              <input value={payload().titleDetails.executableType} readonly id="ex" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm px-3 py-2" placeholder="0"/>
            </div>
          </div>
        </div>
      </Panel>
      <Panel class="mt-4 hidden" label={"Options"}>
        <div class="mt-2">
          <label for="format" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Format</label>
          <select id={"format"} class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {Object.entries(FORMAT_TO_LABEL).map(([value, label]) => <option value={value}>{label}</option>)}
          </select>
        </div>
        <div class="mt-2">
          <label for="padding" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Padding</label>
          <select id={"padding"} class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {Object.entries(PADDING_TO_LABEL).map(([value, label]) => <option value={value}>{label}</option>)}
          </select>
        </div>
        <div class="mt-2">
          <label for="god-layout" class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">GOD Layout</label>
          <select id={"god-layout"} class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {Object.entries(GOD_LAYOUT_TO_LABEL).map(([value, label]) => <option value={value}>{label}</option>)}
          </select>
        </div>
      </Panel>
      <div class="flex items-center gap-3 w-full mt-4">
        <Button variant="warn" class="w-full border border-gray-200 dark:border-gray-700" type="button" onclick={() => Window.getByLabel("select-iso").then((window) => window?.close())}>Cancel</Button>
        <Button variant="primary" class="w-full" type="button" onclick={save}>Save</Button>
      </div>
    </main>
  </>
}

export default SelectIsoScreen;