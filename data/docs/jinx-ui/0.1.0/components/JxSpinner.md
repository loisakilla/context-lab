# JxSpinner

Индикатор неопределённой загрузки. Если известно, сколько осталось, берите `JxProgress` или `JxProgressCircle`, а если грузится содержимое блока — `JxSkeleton`.

Импорт: `import { JxSpinner } from '@jinx-ui/react'`  
Источник: `dist/components/Spinner.d.ts:6`
Ключевые слова: spinner, спиннер, загрузка, ожидание, индикатор

## Сигнатура

```tsx
<JxSpinner size?: number; variant?: 'ring' | 'dots' = 'ring' />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `size` | `number` | нет |  | размер в пикселях |
| `variant` | `"ring" \\| "dots"` | нет | `'ring'` | вид индикатора: `ring` — кольцо, `dots` — точки |

## CSS-классы

`jx-spinner`, `jx-spinner--dots`

## Примеры

### Ожидание ответа

```tsx
<JxSpinner variant="ring" size={20} />
```
