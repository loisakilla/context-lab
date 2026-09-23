# JxTabs

Вкладки с клавиатурной навигацией стрелками. Компонент рендерит только заголовки вкладок: содержимое активной вкладки показывает родитель по текущему `value`. Элементы описываются типом `JxTabItem`: `value` и `label`.

Импорт: `import { JxTabs } from '@jinx-ui/react'`  
Источник: `dist/components/Tabs.d.ts:14`
Ключевые слова: tabs, вкладки, табы, переключение разделов, сегментированный контроль

## Сигнатура

```tsx
<JxTabs items: JxTabItem[]; ariaLabel?: string; className?: string; defaultValue?: string; onValueChange?: (value: string) => void; value?: string; variant?: 'segmented' | 'underline' = 'segmented' />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxTabItem[]` | да |  | список вкладок `{ value, label }` |
| `ariaLabel` | `string` | нет |  | доступное имя списка вкладок |
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `defaultValue` | `string` | нет |  | активная вкладка при первом рендере |
| `onValueChange` | `(value: string) => void` | нет |  | вызывается с `value` выбранной вкладки |
| `value` | `string` | нет |  | активная вкладка в управляемом режиме |
| `variant` | `"segmented" \| "underline"` | нет | `'segmented'` | внешний вид: `segmented` по умолчанию или `underline` |

## CSS-классы

`jx-tab`, `jx-tabs`, `jx-tabs--underline`, `jx-tabs-indicator-segment`, `jx-tabs-indicator-underline`

## Примеры

### Вкладки с содержимым

```tsx
function ProfileTabs({ general, security }: { general: ReactNode; security: ReactNode }) {
  const [tab, setTab] = useState('general');
  return (
    <>
      <JxTabs
        ariaLabel="Разделы профиля"
        items={[
          { value: 'general', label: 'Общее' },
          { value: 'security', label: 'Безопасность' },
        ]}
        value={tab}
        onValueChange={setTab}
      />
      {tab === 'general' ? general : security}
    </>
  );
}
```
