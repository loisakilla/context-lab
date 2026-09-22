# JxProgressCircle

Круговой индикатор прогресса для компактных мест: карточек, плиток, строк таблицы. Для полосы во всю ширину есть `JxProgress`.

Импорт: `import { JxProgressCircle } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Progress.tsx:40`
Ключевые слова: progress circle, круговой прогресс, индикатор, проценты, загрузка

## Сигнатура

```tsx
<JxProgressCircle value: number; max?: number = 100; showValue?: boolean = true />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `number` | да |  | текущее значение |
| `max` | `number` | нет | `100` | максимум шкалы, по умолчанию 100 |
| `showValue` | `boolean` | нет | `true` | показать проценты в центре круга |

## CSS-классы

`jx-progress-circle`, `jx-progress-circle-val`

## Примеры

### Заполненность квоты

```tsx
<JxProgressCircle value={72} showValue />
```
