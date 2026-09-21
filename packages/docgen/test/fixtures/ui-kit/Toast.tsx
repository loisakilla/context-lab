import type { FC, ReactNode } from "react";

export interface ToastProps {
  /** Текст уведомления. */
  message: ReactNode;
  /** Тон уведомления: влияет на цвет и иконку. */
  tone?: "info" | "success" | "warning" | "error";
  /** Через сколько миллисекунд уведомление скроется само. 0 — не скрывать. */
  duration?: number;
  /** Вызывается, когда уведомление закрыто пользователем или по таймеру. */
  onDismiss?: () => void;
  /** Кнопка действия внутри уведомления, например «Отменить». */
  action?: { label: string; onClick: () => void };
}

/**
 * Всплывающее уведомление о результате действия.
 *
 * @keywords уведомление, тост, toast, снекбар, snackbar, нотификация, алерт
 * @example Уведомление об успешном сохранении
 * ```tsx
 * <Toast tone="success" message="Вакансия опубликована" duration={4000} />
 * ```
 * @example Уведомление с отменой действия
 * ```tsx
 * <Toast
 *   tone="info"
 *   message="Кандидат перемещён в архив"
 *   action={{ label: "Отменить", onClick: restore }}
 * />
 * ```
 */
export const Toast: FC<ToastProps> = ({ message, tone = "info", duration = 5000, onDismiss, action }) => {
  return (
    <div role="status" aria-live="polite" data-tone={tone} data-duration={duration}>
      <span>{message}</span>
      {action ? <button onClick={action.onClick}>{action.label}</button> : null}
      <button aria-label="Закрыть" onClick={onDismiss} />
    </div>
  );
};
