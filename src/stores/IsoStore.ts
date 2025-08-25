import {IsoContext, IsoInfo} from "../Interfaces.ts";
import {createStore} from "solid-js/store";

const IsoContextInitialState: IsoContext = {
  selectedISOs: [],
  selectIso: (iso: IsoInfo) => { setIsoStore("selectedISOs",(prev: IsoInfo[]) => prev.includes(iso) ? prev : [...prev, iso]) },
  removeIso: (iso: IsoInfo) => {
    setIsoStore("selectedISOs", (prev: IsoInfo[]) => prev.filter(i => i.source !== iso.source))
  },
  removeAll: () => {
    setIsoStore("selectedISOs", () => [])
  },
}

const [IsoStore, setIsoStore] = createStore(IsoContextInitialState)

export default IsoStore

