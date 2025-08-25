import {ConversionStatus} from "../Interfaces.ts";

interface ProgressBarProps {
  progress: number;
  status?: ConversionStatus;
  hideDetails?: boolean;
}

const ProgressBar = (props: ProgressBarProps) => {
  const getProgress = () => {
    switch (props.status) {
      case ConversionStatus.COMPLETED:
        return <span class="shrink-0 ms-auto size-4 flex justify-center items-center rounded-full bg-teal-500 text-white">
          <svg class="shrink-0 size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      case ConversionStatus.ERROR:
        return <span class="shrink-0 ms-auto size-4 flex justify-center items-center rounded-full bg-red-700 text-white">
          <svg class="shrink-0 size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </span>
      default:
        return <span class="text-sm text-gray-800 dark:text-white">{(props.progress).toFixed(0)}%</span>
    }
  }
  return <div class="flex items-center gap-x-1 whitespace-nowrap">
    <div class="flex w-full h-4 bg-gray-300 rounded-full overflow-hidden dark:bg-neutral-700" role="progressbar" aria-valuenow={props.progress} aria-valuemin="0" aria-valuemax="100">
      <div class="flex flex-col justify-center rounded-full overflow-hidden bg-costal-500 text-xs text-white text-center whitespace-nowrap transition duration-500 ease-in-out dark:bg-costal-100" style={`width: ${props.progress}%`}></div>
    </div>
    { !props.hideDetails && <div class="w-10 text-end">
      {getProgress()}
    </div> }
  </div>
};

export default ProgressBar;