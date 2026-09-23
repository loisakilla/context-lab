# JxRadio

Радиокнопка с подписью. Внутри обычный `<input type="radio">`; варианты одной группы объединяются одинаковым `name`, выбранный задаётся через `checked` и `onChange`.

Импорт: `import { JxRadio } from '@jinx-ui/react'`  
Источник: `dist/components/Radio.d.ts:6`
Ключевые слова: radio, радиокнопка, один из нескольких, выбор варианта, тариф

## Сигнатура

```tsx
<JxRadio label?: ReactNode; wrapClassName?: string />
```

Наследует `Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `label` | `ReactNode` | нет |  | подпись рядом с радиокнопкой |
| `wrapClassName` | `string` | нет |  | класс на обёртке с подписью |

## CSS-классы

`jx-radio`

## Примеры

### Выбор тарифа

```tsx
<div role="radiogroup" aria-label="Тариф">
  <JxRadio name="plan" value="basic" label="Базовый" checked={plan === 'basic'} onChange={() => setPlan('basic')} />
  <JxRadio name="plan" value="pro" label="Про" checked={plan === 'pro'} onChange={() => setPlan('pro')} />
</div>
```
