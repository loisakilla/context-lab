---
component: JxAccordion
keywords: [accordion, аккордеон, раскрывающиеся секции, faq, вопросы и ответы]
---
Список раскрывающихся секций. Элементы описываются типом `JxAccordionItem`: `value`, `title`, `content`. По умолчанию открыта одна секция; `single={false}` разрешает несколько. Открытые секции задаются массивом `value`.

## Props
- items: секции `{ value, title, content }`
- single: только одна открытая секция, `true` по умолчанию
- value: открытые секции в управляемом режиме
- defaultValue: открытые секции при первом рендере
- onValueChange: вызывается с новым списком открытых секций
- className: дополнительный класс корневого элемента

## Examples
### Вопросы и ответы
```tsx
<JxAccordion
  defaultValue={['delivery']}
  items={[
    { value: 'delivery', title: 'Как быстро доставка?', content: 'От одного до трёх дней.' },
    { value: 'refund', title: 'Можно вернуть?', content: 'Да, в течение 14 дней.' },
  ]}
/>
```
