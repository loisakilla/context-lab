# JxKbd

Клавиша в тексте: обозначение горячих клавиш и сочетаний. Для сочетания ставьте несколько элементов подряд.

Импорт: `import { JxKbd } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Kbd.tsx:8`
Ключевые слова: kbd, клавиша, горячие клавиши, сочетание, shortcut

## Сигнатура

```tsx
<JxKbd children?: ReactNode />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | нет |  | название клавиши |

## CSS-классы

`jx-kbd`

## Примеры

### Сочетание клавиш в подсказке

```tsx
<span>
  Сохранить: <JxKbd>Ctrl</JxKbd> <JxKbd>S</JxKbd>
</span>
```
