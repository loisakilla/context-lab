# JxDivider

Горизонтальный разделитель между блоками. С подписью превращается в заголовок секции с линиями по бокам.

Импорт: `import { JxDivider } from '@jinx-ui/react'`  
Источник: `dist/components/Divider.d.ts:6`
Ключевые слова: divider, разделитель, линия, секция

## Сигнатура

```tsx
<JxDivider label?: ReactNode; ref?: Ref<HTMLElement> />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `label` | `ReactNode` | нет |  | подпись в середине разделителя |
| `ref` | `Ref<HTMLElement>` | нет |  |  |

## CSS-классы

`jx-divider`, `jx-rule`

## Примеры

### Разделитель с подписью

```tsx
<JxDivider label="Дополнительно" />
```
