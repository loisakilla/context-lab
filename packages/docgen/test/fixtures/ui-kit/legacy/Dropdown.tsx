export interface DropdownProps {
  /** Список пунктов в формате «значение: подпись». */
  items: Record<string, string>;
  /** Выбранный ключ. */
  selected: string;
  /** Вызывается при выборе пункта. */
  onSelect: (key: string) => void;
  /** Ширина списка в пикселях. */
  width?: number;
}

/**
 * Выпадающий список первой версии дизайн-системы.
 *
 * @deprecated Используйте Select: он поддерживает поиск, множественный выбор и состояние ошибки.
 * @keywords дропдаун, dropdown, выпадающий список, устаревший
 */
export function Dropdown({ items, selected, onSelect, width = 240 }: DropdownProps) {
  return (
    <ul role="listbox" style={{ width }}>
      {Object.entries(items).map(([key, label]) => (
        <li key={key} role="option" aria-selected={key === selected} onClick={() => onSelect(key)}>
          {label}
        </li>
      ))}
    </ul>
  );
}
