import { JSX, Component, splitProps } from 'solid-js';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'warn' | 'danger' | 'disabled';
  class?: string;
}

const variantBase = 'inline-flex items-center justify-center gap-2 font-medium rounded-md focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm';

const variantMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-costal-400 hover:bg-costal-600 text-white',
  secondary: 'bg-costal-200 hover:bg-costal-300 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-white dark:text-gray-200 hover:bg-costal-200 dark:hover:bg-gray-700',
  ghost: 'bg-transparent text-gray-600 border-0 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  warn: 'bg-orange-300 hover:bg-orange-400 text-white',
  danger: 'bg-red-400 hover:bg-red-500 active:bg-red-600 text-white',
  disabled: 'bg-costal-100 text-white'
};

const Button: Component<ButtonProps> = (props) => {
  // Preserve reactivity for disabled/variant/class by using splitProps instead of plain destructuring
  const [local, rest] = splitProps(props, ['variant', 'class', 'disabled']);
  const variant = () => local.variant ?? 'secondary';
  const variantClasses = () => (local.disabled ? variantMap['disabled'] : variantMap[variant()]);
  return (
    <button
      {...rest}
      disabled={local.disabled}
      class={`${variantBase} ${variantClasses()} px-4 py-2 ${local.class || ''}`}
    />
  );
};

export default Button;
