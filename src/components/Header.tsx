import {SelectIso} from "../windows/SelectIso.ts";
import Button from "./Button";
import {invoke} from "@tauri-apps/api/core";
import {ConversionStatus} from "../Interfaces.ts";
import ProgressStore from "../stores/ProgressStore.ts";
import IsoStore from "../stores/IsoStore.ts";
import {createMemo} from "solid-js";

const Header = () => {
  const isConverting = createMemo(() => ProgressStore.status === ConversionStatus.CONVERTING);

  const convertIsos = async () => {
    ProgressStore.resetProgress()
    ProgressStore.updateStatus(ConversionStatus.CONVERTING)
    invoke("convert", { isos: IsoStore.selectedISOs })
      .then(() => ProgressStore.updateStatus(ConversionStatus.COMPLETED))
      .catch(() => ConversionStatus.ERROR);
  }

  return <>
    <nav class="w-full flex justify-between">
      <div class={"flex gap-2"}>
        <Button
          variant="primary"
          onclick={() => { convertIsos() }}
          type="button"
          disabled={isConverting()}
        >
          Convert
        </Button>
        <Button
          variant="warn"
          onclick={() => {
            IsoStore.removeAll()
            ProgressStore.resetProgress()
          }}
          disabled={isConverting()}
          type="button"
        >
          Remove All
        </Button>
        <Button
          variant="danger"
          onclick={() => {
            invoke("cancel")
              .then(() => ProgressStore.updateStatus(ConversionStatus.ERROR))
              .catch((err) => alert("Failed to cancel conversion: " + err.message));
          }}
          type="button"
          disabled={!isConverting()}
        >
          Stop
        </Button>
      </div>
      <Button
        variant="primary"
        onclick={() => { const selectIso = new SelectIso(); selectIso.open() }}
        type="button"
      >
        Select ISO
      </Button>
    </nav>
  </>
}

export default Header;