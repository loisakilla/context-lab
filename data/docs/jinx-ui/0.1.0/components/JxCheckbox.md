# JxCheckbox

Флажок с подписью. Внутри обычный `<input type="checkbox">`: `checked`, `onChange`, `name`, `disabled` передаются напрямую. Для взаимоисключающего выбора используйте `JxRadio`, для настроек «вкл/выкл» — `JxSwitch`.

Импорт: `import { JxCheckbox } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Checkbox.tsx:9`
Ключевые слова: checkbox, чекбокс, флажок, согласие, выбрать несколько, галочка

## Сигнатура

```tsx
<JxCheckbox label?: ReactNode; wrapClassName?: string />
```

Наследует `Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `label` | `ReactNode` | нет |  | подпись рядом с флажком |
| `wrapClassName` | `string` | нет |  | класс на обёртке с подписью |

## CSS-классы

`jx-check`

## Примеры

### Согласие с условиями

```tsx
<JxCheckbox
  label="Согласен с условиями обработки данных"
  checked={agreed}
  onChange={(event) => setAgreed(event.target.checked)}
/>
```
