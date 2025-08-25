import {ConversionStatus, ProgressContext} from "../Interfaces.ts";
import {createStore} from "solid-js/store";
import {invoke} from "@tauri-apps/api/core";

const IsoConvertProgress: ProgressContext = {
  progressList: [],
  setProgress: (source: string, progress: number) => {
    setProgressStore((prev) => {
      const index = prev.progressList.findIndex(p => p.source === source);
      if (index !== -1) {
        const newProgressList = [...prev.progressList];
        newProgressList[index] = {source, progress};
        return {...prev, progressList: newProgressList};
      } else {
        return {...prev, progressList: [...prev.progressList, {source, progress}]};
      }
    })
  },
  resetProgress: () => {
    setProgressStore((prev) => {
      if (prev.status === ConversionStatus.CONVERTING) {
        invoke("cancel")
          .catch(() => ConversionStatus.ERROR);
      }

      return {...prev, progressList: [], status: ConversionStatus.IDLE}
    })
  },
  getProgress: (source: string) => {
    const progress = ProgressStore.progressList.find(p => p.source === source);
    return progress ? progress.progress : 0;
  },
  status: ConversionStatus.IDLE,
  updateStatus: (status: ConversionStatus) => {
    setProgressStore("status", status)
  }
}

const [ProgressStore, setProgressStore] = createStore(IsoConvertProgress)

export default ProgressStore;