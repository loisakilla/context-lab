# JxProgress

Горизонтальная полоса прогресса. Значение сравнивается с `max`, подпись выводится рядом с полосой.

Импорт: `import { JxProgress } from '@jinx-ui/react'`  
Источник: `dist/components/Progress.d.ts:8`
Ключевые слова: progress, прогресс, полоса загрузки, заполнение, процент выполнения

## Сигнатура

```tsx
<JxProgress value: number; label?: string; max?: number = 100; ref?: Ref<HTMLDivElement> />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `number` | да |  | текущее значение |
| `label` | `string` | нет |  | подпись слева от полосы |
| `max` | `number` | нет | `100` | максимум, 100 по умолчанию |
| `ref` | `Ref<HTMLDivElement>` | нет |  |  |

## CSS-классы

`jx-progress`, `jx-progress-bar`

## Примеры

### Загрузка файла

```tsx
function UploadProgress({ uploaded, total }: { uploaded: number; total: number }) {
  return <JxProgress label="Загрузка" value={uploaded} max={total} />;
}
```
