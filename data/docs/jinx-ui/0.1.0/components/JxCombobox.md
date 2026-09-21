# JxCombobox

Поле с автодополнением: пользователь печатает, список фильтруется, выбор одного значения. Опции `JxComboboxOption`: `value`, `label`, необязательные `subLabel` и `icon`. Для множественного выбора тегов используйте `JxTagInput`.

Импорт: `import { JxCombobox } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Combobox.tsx:24`
Ключевые слова: combobox, автодополнение, поиск по списку, autocomplete, подсказки, поиск

## Сигнатура

```tsx
<JxCombobox options: JxComboboxOption[]; ariaLabel?: string; className?: string; defaultValue?: string; emptyText?: string = 'No matches. Try fewer letters.'; onValueChange?: (value: string) => void; placeholder?: string = 'Search...'; value?: string />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `options` | `JxComboboxOption[]` | да |  | список опций `{ value, label, subLabel?, icon? }` |
| `ariaLabel` | `string` | нет |  | доступное имя поля, если нет видимой подписи |
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `defaultValue` | `string` | нет |  | начальное значение |
| `emptyText` | `string` | нет | `'No matches. Try fewer letters.'` | текст, когда фильтр ничего не нашёл |
| `onValueChange` | `(value: string) => void` | нет |  | вызывается с новым значением при выборе |
| `placeholder` | `string` | нет | `'Search...'` | текст в пустом поле |
| `value` | `string` | нет |  | выбранное значение в управляемом режиме |

## CSS-классы

`jx-combobox`, `jx-combobox-empty`, `jx-combobox-input`, `jx-combobox-list`, `jx-combobox-option`, `jx-combobox-option-sub`

## Примеры

### Поиск сотрудника

```tsx
<JxCombobox
  ariaLabel="Сотрудник"
  placeholder="Начните вводить имя"
  emptyText="Никого не нашли"
  options={people.map((person) => ({ value: person.id, label: person.name, subLabel: person.role }))}
  value={assigneeId}
  onValueChange={setAssigneeId}
/>
```
