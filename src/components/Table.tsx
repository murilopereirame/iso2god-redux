import { JSX, Show } from 'solid-js';

interface TableProps {
  headers: { id: string; label: string }[];
  rows: { id: string, content: JSX.Element[] }[];
  dense?: boolean;
  class?: string;
}

const Table = (props: TableProps): JSX.Element => {
  const cellPadding = () => props.dense ? 'px-3 py-2' : 'px-6 py-4';
  const headPadding = () => props.dense ? 'px-3 py-2' : 'px-6 py-3';

  return (
    <div class={`relative overflow-x-auto shadow-md sm:rounded-lg ${props.class || ''} max-w-full`}>
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 max-w-full border-collapse">
        <thead class="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {props.headers.map(h => (
              <th scope="col" class={`${headPadding()} font-semibold tracking-wide`} data-header-id={h.id}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Show when={props.rows.length > 0} fallback={
            <tr>
              <td class={`${cellPadding()} italic text-gray-400 dark:text-gray-500`} colSpan={props.headers.length}>No data</td>
            </tr>
          }>
            {props.rows.map(r => (
              <tr class="bg-gray-200 border-b dark:bg-gray-600 dark:border-gray-500 border-gray-200 last:border-0 whitespace-nowrap w-full max-w-0" data-row-id={r.id}>
                {
                  r.content.map((content) => (<td class={`${cellPadding()} overflow-ellipsis overflow-hidden whitespace-normal text-pretty`}>
                    {content}
                    </td>
                  ))
                }
              </tr>
            ))}
          </Show>
        </tbody>
      </table>
    </div>
  );
};

export default Table;