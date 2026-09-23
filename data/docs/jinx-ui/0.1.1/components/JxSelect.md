# JxSelect

Выпадающий список с одним выбранным значением, клавиатурной навигацией и группами. Управляемый через `value` и `onValueChange` или неуправляемый через `defaultValue`. Опции описываются массивом `JxSelectOption`: `value`, `label`, необязательные `meta`, `group`, `disabled`.

Импорт: `import { JxSelect } from '@jinx-ui/react'`  
Источник: `dist/components/Select.d.ts:19`
Ключевые слова: select, выпадающий список, выбор, дропдаун, dropdown, язык, статус, категория

## Сигнатура

```tsx
<JxSelect options: JxSelectOption[]; className?: string; defaultValue?: string; label?: string; onValueChange?: (value: string) => void; placeholder?: string = 'Select'; ref?: Ref<HTMLButtonElement>; value?: string />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `options` | `JxSelectOption[]` | да |  | список опций `{ value, label, meta?, group?, disabled? }` |
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `defaultValue` | `string` | нет |  | начальное значение в неуправляемом режиме |
| `label` | `string` | нет |  | подпись над списком |
| `onValueChange` | `(value: string) => void` | нет |  | вызывается с новым значением при выборе |
| `placeholder` | `string` | нет | `'Select'` | текст, пока ничего не выбрано |
| `ref` | `Ref<HTMLButtonElement>` | нет |  | ссылка на кнопку, которая открывает список |
| `value` | `string` | нет |  | выбранное значение в управляемом режиме |

## CSS-классы

`jx-field`, `jx-label`, `jx-select`, `jx-select-caret`, `jx-select-check`, `jx-select-divider`, `jx-select-group`, `jx-select-menu`, `jx-select-option`, `jx-select-option-label`, `jx-select-option-meta`, `jx-select-placeholder`, `jx-select-trigger`, `jx-select-value`

## Примеры

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
