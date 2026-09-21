# JxProgress

Горизонтальная полоса прогресса. Значение сравнивается с `max`, подпись выводится рядом с полосой.

Импорт: `import { JxProgress } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Progress.tsx:11`
Ключевые слова: progress, прогресс, полоса загрузки, заполнение, процент выполнения

## Сигнатура

```tsx
<JxProgress value: number; label?: string; max?: number = 100 />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `number` | да |  | текущее значение |
| `label` | `string` | нет |  | подпись слева от полосы |
| `max` | `number` | нет | `100` | максимум, 100 по умолчанию |

## CSS-классы

`jx-progress`, `jx-progress-bar`

## Примеры

### Загрузка файла

```tsx
<JxProgress label="Загрузка" value={uploaded} max={total} />
```
