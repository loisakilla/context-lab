import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Содержимое кнопки: текст или текст с иконкой. */
  children: ReactNode;
  /** Визуальный стиль кнопки. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Размер кнопки. Влияет на высоту и горизонтальные отступы. */
  size?: "sm" | "md" | "lg";
  /** Показывает спиннер вместо иконки и блокирует повторные клики. */
  loading?: boolean;
  /** Растягивает кнопку на всю ширину контейнера. */
  fullWidth?: boolean;
  /** Иконка слева от текста. */
  iconBefore?: ReactNode;
  /**
   * Цвет кнопки.
   * @deprecated Используйте variant: цвета берутся из токенов дизайн-системы.
   */
  color?: string;
}

/**
 * Основная кнопка действия. Используется в формах, диалогах и тулбарах.
 *
 * @keywords кнопка, button, действие, submit, сабмит, клик
 * @example Кнопка сохранения формы
 * ```tsx
 * <Button variant="primary" onClick={handleSave}>Сохранить</Button>
 * ```
 * @example Кнопка в состоянии загрузки
 * ```tsx
 * <Button variant="primary" loading disabled>Отправляем…</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      iconBefore,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth || undefined}
        disabled={loading || rest.disabled}
        {...rest}
      >
        {loading ? <span role="progressbar" /> : iconBefore}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
