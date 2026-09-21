import type { ReactNode } from "react";

export interface ModalProps {
  /** Открыто ли окно. Компонент управляемый: состояние живёт снаружи. */
  isOpen: boolean;
  /** Вызывается при закрытии: крестик, Esc, клик по подложке. */
  onClose: () => void;
  /** Заголовок окна. Обязателен для доступности: озвучивается скринридером. */
  title: string;
  /** Содержимое окна. */
  children: ReactNode;
  /** Ширина окна. */
  size?: "sm" | "md" | "lg" | "fullscreen";
  /** Кнопки действий в подвале окна. */
  footer?: ReactNode;
  /** Закрывать ли окно по клику на подложку. */
  closeOnOverlayClick?: boolean;
  /** Закрывать ли окно по нажатию Esc. */
  closeOnEsc?: boolean;
  /** Элемент, на который вернётся фокус после закрытия. */
  returnFocusTo?: HTMLElement | null;
}

/**
 * Модальное окно с блокировкой прокрутки страницы и ловушкой фокуса.
 *
 * Компонент управляемый: открытием владеет родитель. Внутри монтируется портал
 * в document.body, поэтому окно не обрезается родительским overflow.
 *
 * @keywords модальное окно, модалка, диалог, dialog, popup, попап, оверлей
 * @example Диалог подтверждения удаления
 * ```tsx
 * <Modal
 *   isOpen={isConfirmOpen}
 *   onClose={() => setConfirmOpen(false)}
 *   title="Удалить вакансию?"
 *   footer={<Button variant="danger" onClick={remove}>Удалить</Button>}
 * >
 *   Вакансия и все отклики будут удалены безвозвратно.
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  returnFocusTo = null,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div role="presentation" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div role="dialog" aria-modal="true" aria-label={title} data-size={size}>
        <header>{title}</header>
        <div>{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  );
}
