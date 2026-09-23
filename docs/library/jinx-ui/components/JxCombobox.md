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
- clearLabel: доступное имя кнопки очистки; кнопка появляется, когда в поле есть текст, и возвращает фокус в поле
- className: дополнительный класс корневого элемента
- ref: ссылка на поле поиска

## Examples
### Поиск сотрудника
```tsx
const people = [
  { id: 'u1', name: 'Анна Смирнова', role: 'Дизайнер' },
  { id: 'u2', name: 'Илья Ковалёв', role: 'Разработчик' },
  { id: 'u3', name: 'Мария Орлова', role: 'Менеджер' },
];

function AssigneePicker() {
  const [assigneeId, setAssigneeId] = useState('');
  return (
    <JxCombobox
      ariaLabel="Сотрудник"
      placeholder="Начните вводить имя"
      emptyText="Никого не нашли"
      options={people.map((person) => ({ value: person.id, label: person.name, subLabel: person.role }))}
      value={assigneeId}
      onValueChange={setAssigneeId}
    />
  );
}
```
