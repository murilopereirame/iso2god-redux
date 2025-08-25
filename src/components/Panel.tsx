import {Component, JSX} from 'solid-js';

interface PanelProps extends JSX.HTMLAttributes<HTMLFieldSetElement>{
  label: string;
  children?: JSX.Element;
}

const Panel: Component<PanelProps> = ({children, ...props}) => {
  return (
    <fieldset {...props} class={`flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 pt-3 pb-4 space-y-3 ${props.class || ''}`}>
      <legend class="px-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{props.label}</legend>
      <div class="flex flex-col gap-2">
        {children}
      </div>
    </fieldset>
  );
};

export default Panel;