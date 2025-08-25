/* @refresh reload */
import { render } from "solid-js/web";
import MainScreen from "./screens/MainScreen.tsx";
import {Route, Router} from "@solidjs/router";
import SelectIsoScreen from "./screens/SelectIsoScreen.tsx";
import {listen} from "@tauri-apps/api/event";
import {ProgressReport} from "./Interfaces.ts";
import ProgressStore from "./stores/ProgressStore.ts";
import { attachConsole } from '@tauri-apps/plugin-log';

listen<ProgressReport>("progress-report", (event) => {
  ProgressStore.setProgress(event.payload.source, event.payload.progress)
})

attachConsole();

render(() => {
  return <Router>
      <Route path="/" component={MainScreen} />
      <Route path="/select-iso" component={SelectIsoScreen} />
   </Router>
}, document.getElementById("root") as HTMLElement);
