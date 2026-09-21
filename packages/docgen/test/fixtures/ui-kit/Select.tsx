import type { ReactNode } from "react";

export interface SelectOption {
  /** Значение, которое уходит в onChange. */
  value: string;
  /** Подпись опции в списке. */
  label: string;
  /** Заблокирована ли опция. */
  disabled?: boolean;
}

export interface SelectProps {
  /** Доступные опции. */
  options: SelectOption[];
  /** Выбранное значение. Массив, когда multiple выставлен в true. */
  value: string | string[] | null;
  /** Вызывается при выборе опции. */
  onChange: (value: string | string[] | null) => void;
  /** Подпись поля. */
  label?: string;
  /** Текст, когда ничего не выбрано. */
  placeholder?: string;
  /** Разрешить выбор нескольких значений. */
  multiple?: boolean;
  /** Показать поле поиска внутри выпадающего списка. */
  searchable?: boolean;
  /** Разрешить сброс значения крестиком. */
  clearable?: boolean;
  /** Текст ошибки под полем. Включает состояние ошибки. */
  error?: ReactNode;
  /** Заблокировать поле. */
  disabled?: boolean;
}

/**
 * Выпадающий список с поиском, множественным выбором и состоянием ошибки.
 *
 * @keywords селект, select, выпадающий список, дропдаун, выбор, фильтр, мультиселект
 * @example Мультиселект фильтра по менеджерам
 * ```tsx
 * <Select
 *   label="Менеджеры"
 *   options={managers.map((m) => ({ value: m.id, label: m.name }))}
 *   value={selectedManagers}
 *   onChange={setSelectedManagers}
 *   multiple
 *   searchable
 *   clearable
 * />
 * ```
 */
export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = "Не выбрано",
  multiple = false,
  searchable = false,
  clearable = false,
  error,
  disabled = false,
}: SelectProps) {
  const isEmpty = value === null || (Array.isArray(value) && value.length === 0);

  return (
    <div data-multiple={multiple || undefined} data-invalid={error ? true : undefined}>
      {label ? <label>{label}</label> : null}
      <button disabled={disabled} aria-haspopup="listbox">
        {isEmpty ? placeholder : String(value)}
      </button>
      {clearable && !isEmpty ? <button aria-label="Очистить" onClick={() => onChange(multiple ? [] : null)} /> : null}
      {searchable ? <input type="search" aria-label="Поиск по списку" /> : null}
      <ul role="listbox">
        {options.map((option) => (
          <li key={option.value} role="option" aria-disabled={option.disabled}>
            {option.label}
          </li>
        ))}
      </ul>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
