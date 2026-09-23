# JxSnip

Инлайновый код внутри строки текста: имя пропса, путь файла, короткая команда. Для многострочного кода с копированием есть `JxSnippet`.

Импорт: `import { JxSnip } from '@jinx-ui/react'`  
Источник: `dist/components/Snippet.d.ts:14`
Ключевые слова: snip, инлайновый код, моноширинный, имя пропса

## Сигнатура

```tsx
<JxSnip children?: ReactNode />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | нет |  | текст кода |

## CSS-классы

`jx-snip`

## Примеры

### Упоминание пропса в тексте

```tsx
<p>
  Передайте <JxSnip>onValueChange</JxSnip>, чтобы получать изменения.
</p>
```
