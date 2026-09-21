# JxAccordion

Список раскрывающихся секций. Элементы описываются типом `JxAccordionItem`: `value`, `title`, `content`. По умолчанию открыта одна секция; `single={false}` разрешает несколько. Открытые секции задаются массивом `value`.

Импорт: `import { JxAccordion } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Accordion.tsx:22`
Ключевые слова: accordion, аккордеон, раскрывающиеся секции, faq, вопросы и ответы

## Сигнатура

```tsx
<JxAccordion items: JxAccordionItem[]; className?: string; defaultValue?: string[]; onValueChange?: (value: string[]) => void; single?: boolean = true; value?: string[] />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxAccordionItem[]` | да |  | секции `{ value, title, content }` |
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `defaultValue` | `string[]` | нет |  | открытые секции при первом рендере |
| `onValueChange` | `(value: string[]) => void` | нет |  | вызывается с новым списком открытых секций |
| `single` | `boolean` | нет | `true` | только одна открытая секция, `true` по умолчанию |
| `value` | `string[]` | нет |  | открытые секции в управляемом режиме |

## CSS-классы

`jx-accordion`, `jx-accordion-body`, `jx-accordion-content`, `jx-accordion-icon`, `jx-accordion-item`, `jx-accordion-trigger`

## Примеры

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
