---
component: JxRadio
keywords: [radio, радиокнопка, один из нескольких, выбор варианта, тариф]
---
Радиокнопка с подписью. Внутри обычный `<input type="radio">`; варианты одной группы объединяются одинаковым `name`, выбранный задаётся через `checked` и `onChange`.

## Props
- label: подпись рядом с радиокнопкой
- wrapClassName: класс на обёртке с подписью

## Examples
### Выбор тарифа
```tsx
<div role="radiogroup" aria-label="Тариф">
  <JxRadio name="plan" value="basic" label="Базовый" checked={plan === 'basic'} onChange={() => setPlan('basic')} />
  <JxRadio name="plan" value="pro" label="Про" checked={plan === 'pro'} onChange={() => setPlan('pro')} />
</div>
```
