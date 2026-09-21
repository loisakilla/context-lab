---
component: JxCombobox
keywords: [combobox, автодополнение, поиск по списку, autocomplete, подсказки, поиск]
---
Поле с автодополнением: пользователь печатает, список фильтруется, выбор одного значения. Опции `JxComboboxOption`: `value`, `label`, необязательные `subLabel` и `icon`. Для множественного выбора тегов используйте `JxTagInput`.

## Props
- options: список опций `{ value, label, subLabel?, icon? }`
- value: выбранное значение в управляемом режиме
- defaultValue: начальное значение
- onValueChange: вызывается с новым значением при выборе
- placeholder: текст в пустом поле
- emptyText: текст, когда фильтр ничего не нашёл
- ariaLabel: доступное имя поля, если нет видимой подписи
- className: дополнительный класс корневого элемента

## Examples
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
