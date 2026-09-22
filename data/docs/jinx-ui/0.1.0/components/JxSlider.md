# JxSlider

Ползунок для выбора числа в диапазоне: громкость, масштаб, бюджет. Управляемый через `value` и `onValueChange`, неуправляемый — через `defaultValue`. Границы и шаг задаются обычными атрибутами `input[type=range]`: `min`, `max`, `step`; по умолчанию это диапазон от 0 до 100 с шагом 1.

Импорт: `import { JxSlider } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Slider.tsx:15`
Ключевые слова: slider, слайдер, ползунок, диапазон, громкость, значение

## Сигнатура

```tsx
<JxSlider defaultValue?: number; label?: ReactNode; onValueChange?: (value: number) => void; showOutput?: boolean = true; unit?: string = ''; value?: number />
```

Наследует `Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "value" | "onChange" | "type">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `defaultValue` | `number` | нет |  | начальное значение в неуправляемом режиме |
| `label` | `ReactNode` | нет |  | подпись над ползунком |
| `onValueChange` | `(value: number) => void` | нет |  | вызывается при изменении значения |
| `showOutput` | `boolean` | нет | `true` | показать текущее значение рядом с подписью |
| `unit` | `string` | нет | `''` | единица измерения рядом со значением |
| `value` | `number` | нет |  | текущее значение в управляемом режиме |

## CSS-классы

`jx-slider`, `jx-slider-wrap`

## Примеры

### Бюджет контекста

```tsx
<JxSlider label="Масштаб интерфейса" min={80} max={140} step={10} defaultValue={100} unit="%" showOutput />
```
