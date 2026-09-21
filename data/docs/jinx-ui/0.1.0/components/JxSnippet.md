# JxSnippet

Импорт: `import { JxSnippet } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Snippet.tsx:27`

## Сигнатура

```tsx
<JxSnippet block?: boolean = false; children?: ReactNode; copyText?: string; prompt?: ReactNode; tone?: JxSnippetTone = 'default' />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `block` | `boolean` | нет | `false` |  |
| `children` | `ReactNode` | нет |  |  |
| `copyText` | `string` | нет |  |  |
| `prompt` | `ReactNode` | нет |  |  |
| `tone` | `"alt" \\| "default" \\| "info"` | нет | `'default'` |  |

## CSS-классы

`jx-snippet`, `jx-snippet--alt`, `jx-snippet--block`, `jx-snippet--info`, `jx-snippet-code`, `jx-snippet-copy`, `jx-snippet-prompt`
