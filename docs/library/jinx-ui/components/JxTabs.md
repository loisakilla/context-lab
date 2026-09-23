---
component: JxTabs
keywords: [tabs, вкладки, табы, переключение разделов, сегментированный контроль]
---
Вкладки с клавиатурной навигацией стрелками. Компонент рендерит только заголовки вкладок: содержимое активной вкладки показывает родитель по текущему `value`. Элементы описываются типом `JxTabItem`: `value` и `label`.

## Props
- items: список вкладок `{ value, label }`
- value: активная вкладка в управляемом режиме
- defaultValue: активная вкладка при первом рендере
- onValueChange: вызывается с `value` выбранной вкладки
- variant: внешний вид: `segmented` по умолчанию или `underline`
- ariaLabel: доступное имя списка вкладок
- className: дополнительный класс корневого элемента

## Examples
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
