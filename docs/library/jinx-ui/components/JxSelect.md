---
component: JxSelect
keywords: [select, выпадающий список, выбор, дропдаун, dropdown, язык, статус, категория]
---
Выпадающий список с одним выбранным значением, клавиатурной навигацией и группами. Управляемый через `value` и `onValueChange` или неуправляемый через `defaultValue`. Опции описываются массивом `JxSelectOption`: `value`, `label`, необязательные `meta`, `group`, `disabled`.

## Props
- options: список опций `{ value, label, meta?, group?, disabled? }`
- value: выбранное значение в управляемом режиме
- defaultValue: начальное значение в неуправляемом режиме
- onValueChange: вызывается с новым значением при выборе
- placeholder: текст, пока ничего не выбрано
- label: подпись над списком
- className: дополнительный класс корневого элемента

## Examples
### Выбор языка интерфейса
```tsx
function LanguageSelect() {
  const [language, setLanguage] = useState('ru');
  return (
    <JxSelect
      label="Язык"
      options={[
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'English' },
      ]}
      value={language}
      onValueChange={setLanguage}
    />
  );
}
```

### Опции с группами и подписями
```tsx
<JxSelect
  placeholder="Выберите статус"
  options={[
    { value: 'new', label: 'Новый', group: 'Активные', meta: '12' },
    { value: 'in_progress', label: 'В работе', group: 'Активные' },
    { value: 'closed', label: 'Закрыт', group: 'Архив', disabled: true },
  ]}
  defaultValue="new"
/>
```
