# JxSlider

Импорт: `import { JxSlider } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Slider.tsx:15`

## Сигнатура

```tsx
<JxSlider defaultValue?: number; label?: ReactNode; onValueChange?: (value: number) => void; showOutput?: boolean = true; unit?: string = ''; value?: number />
```

Наследует `Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "value" | "onChange" | "type">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `defaultValue` | `number` | нет |  |  |
| `label` | `ReactNode` | нет |  |  |
| `onValueChange` | `(value: number) => void` | нет |  |  |
| `showOutput` | `boolean` | нет | `true` |  |
| `unit` | `string` | нет | `''` |  |
| `value` | `number` | нет |  |  |

## CSS-классы

`jx-slider`, `jx-slider-wrap`
