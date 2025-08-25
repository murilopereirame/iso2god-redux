import Header from "../components/Header.tsx";
import "../styles/MainScreen.css";
import Table from "../components/Table.tsx";
import Button from "../components/Button.tsx";
import {ConversionStatus, IsoInfo, PLATFORM_TO_LABEL} from "../Interfaces.ts";
import ProgressBar from "../components/ProgressBar.tsx";
import {createEffect, createSignal, onCleanup} from "solid-js";
import {getCurrentWebview} from "@tauri-apps/api/webview";
import {SelectIso} from "../windows/SelectIso.ts";
import ProgressStore from "../stores/ProgressStore.ts";
import IsoStore from "../stores/IsoStore.ts";

function MainScreen() {
  const [progress, setProgress] = createSignal(0)

  const headers = [
    { id: 'iso-name', label: 'ISO Name'},
    { id: 'title-id', label: 'Title ID'},
    { id: 'game-title', label: 'Game Title'},
    { id: 'platform', label: 'Platform'},
    { id: 'progress', label: 'Progress'},
    { id: 'output', label: 'Output'},
    { id: 'actions', label: 'Actions'},
  ]

  createEffect(() => {
    const sum = ProgressStore.progressList.reduce((acc, item) => acc + item.progress, 0);
    const avg = ProgressStore.progressList.length ? sum / ProgressStore.progressList.length : 0;

    setProgress(avg);
  })

  createEffect(async () => {
    const unlisten = await getCurrentWebview().onDragDropEvent(async (e) => {
      if (e.payload.type === "drop") {
        const paths = e.payload.paths as string[]
        for (const path of paths) {
          if (!path.toLowerCase().endsWith("iso")) { continue; }
          const selectIso = new SelectIso(path);
          await selectIso.open()
        }
      }
    })

    onCleanup(() => {
      unlisten()
    })
  })

  const buildIsoRow = (iso: IsoInfo) => {
    return {
      id: iso.source,
      content: [
        iso.source.split("/").pop() || iso.isoPath,
        iso.titleDetails.titleId,
        iso.titleDetails.name,
        PLATFORM_TO_LABEL[iso.titleDetails.platform],
        <ProgressBar hideDetails={true} progress={ProgressStore.getProgress(iso.source)}
                     status={ProgressStore.status}/>,
        iso.godPath,
        <Button disabled={ProgressStore.status !== ConversionStatus.IDLE} onclick={() => IsoStore.removeIso(iso)} variant={"danger"} type={"button"}>Remove</Button>
      ]
    };
  }

  return (
    <main class="min-h-screen w-full flex flex-col p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div class="mx-auto space-y-4 h-full w-full flex-1">
        <Header />
        <div class={"flex flex-col justify-between gap-4 h-full mt-2"}>
          <section class="bg-gray-100 dark:bg-gray-800 shadow-md rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Selected ISOs
            </h2>
            <Table headers={headers}
                   rows={IsoStore.selectedISOs.map(buildIsoRow)} class="w-full" />
          </section>
        </div>
      </div>
      <div class={"h-full flex flex-col justify-end"}>
        <ProgressBar progress={progress()} status={ProgressStore.status} />
      </div>
    </main>
  );
}

export default MainScreen;
