export enum ConversionStatus {
  IDLE,
  CONVERTING,
  COMPLETED,
  ERROR,
}

export enum GODLayout {
  TITLE_ID,
  NAME,
  NAME_SLASH_TITLE_ID,
  NAME_DASH_TITLE_ID
}

export enum Format {
  GOD,
  GOD_AND_ISO,
  ISO,
}

export enum Padding {
  UNTOUCHED,
  PARTIAL,
  REMOVE_ALL
}

export const FORMAT_TO_LABEL: Record<Format, string> = {
  [Format.GOD]: "GOD Package",
  [Format.GOD_AND_ISO]: "GOD Package and ISO file",
  [Format.ISO]: "ISO file",
}

export const PADDING_TO_LABEL: Record<Padding, string> = {
  [Padding.UNTOUCHED]: "Untouched (no padding)",
  [Padding.PARTIAL]: "Partial (padding removed from the end)",
  [Padding.REMOVE_ALL]: "Remove all",
}

export const GOD_LAYOUT_TO_LABEL: Record<GODLayout, string> = {
  [GODLayout.TITLE_ID]: "\\Title ID\\",
  [GODLayout.NAME]: "\\Name\\",
  [GODLayout.NAME_SLASH_TITLE_ID]: "\\Name\\Title ID\\",
  [GODLayout.NAME_DASH_TITLE_ID]: "\\Name - Title ID\\",
}

export interface TitleDetails {
  name: string
  titleId: string
  mediaId: string
  disc: {
    current: number
    total: number
  }
  platform: Platform
  executableType: number
}

export interface OutputOptions {
  format: Format
  autoRename: boolean
  godLayout: GODLayout
  padding: Padding
}

export interface IsoInfo {
  source: string
  godPath: string
  isoPath: string
  titleDetails: TitleDetails
  outputOptions: OutputOptions
}

export enum Platform {
  XBOX360,
  XBOX,
}

export const PLATFORM_TO_LABEL: Record<Platform, string> = {
  [Platform.XBOX]: "Xbox",
  [Platform.XBOX360]: "Xbox 360",
}

export interface IsoContext {
  selectedISOs: IsoInfo[]
  selectIso: (iso: IsoInfo) => void
  removeIso: (iso: IsoInfo) => void
  removeAll: () => void
}

export interface ProgressContext {
  progressList: {
    source: string
    progress: number
  }[]
  setProgress: (source: string, progress: number) => void
  resetProgress: () => void
  status: ConversionStatus
  updateStatus: (status: ConversionStatus) => void
  getProgress: (source: string) => number
}

export interface ProgressReport {
  source: string
  progress: number
}