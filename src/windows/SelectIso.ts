import {Window} from "@tauri-apps/api/window";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";
import {IsoInfo} from "../Interfaces.ts";
import {error} from "@tauri-apps/plugin-log";
import IsoStore from "../stores/IsoStore.ts";

export class SelectIso {
  constructor(private path?: string) {}

  private async createWindow() {
    const window = new WebviewWindow("select-iso", {
      url: '/select-iso',
      title: "Select ISO",
      width: 400,
      height: 885,
      resizable: false,
      parent: "main",
    });

    window.once("tauri://error", (event) => {
      error(`Error creating Select ISO window: ${JSON.stringify(event.payload)}`);
    })

    window.once<IsoInfo>("save", (event) => {
      IsoStore.selectIso(event.payload)
      this.closeWindow()
    });

    window.listen("iso-page-ready", () => {
      if (this.path) {
        window.emit("iso-selected", {path: this.path});
      }
    })

    window.once("tauri://close-requested", async () => {
      this.path = undefined;
    })

    return window;
  }

  async getWindow(): Promise<Window> {
    const existing = await WebviewWindow.getByLabel("select-iso");

    if (existing) {
      try {
        return existing;
      } catch (e) {
        console.warn("Window exists but failed to focus. Recreating...");
      }
    }

    return await this.createWindow();
  }

  async closeWindow() {
    const window = await this.getWindow();
    await window.close();
  }

  async open() {
    const window = await this.getWindow();
    window.setFocus()

    return new Promise(async resolve => {
      window.once("tauri://close-requested", async (event) => {
        await window.close();
        resolve(event);
      })
    })
  }
}