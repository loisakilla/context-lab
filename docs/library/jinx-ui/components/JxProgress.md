---
component: JxProgress
keywords: [progress, прогресс, полоса загрузки, заполнение, процент выполнения]
---
Горизонтальная полоса прогресса. Значение сравнивается с `max`, подпись выводится рядом с полосой.

## Props
- value: текущее значение
- max: максимум, 100 по умолчанию
- label: подпись слева от полосы

## Examples
### Загрузка файла
```tsx
function UploadProgress({ uploaded, total }: { uploaded: number; total: number }) {
  return <JxProgress label="Загрузка" value={uploaded} max={total} />;
}
```
