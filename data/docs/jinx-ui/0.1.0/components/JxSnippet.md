# JxSnippet

Блок кода или команды с кнопкой копирования. `prompt` рисует приглашение терминала, `block` разворачивает сниппет на всю ширину.

Импорт: `import { JxSnippet } from '@jinx-ui/react'`  
Источник: `dist/components/Snippet.d.ts:10`
Ключевые слова: snippet, код, команда, копировать, терминал

## Сигнатура

```tsx
<JxSnippet block?: boolean = false; children?: ReactNode; copyText?: string; prompt?: ReactNode; tone?: JxSnippetTone = 'default' />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `block` | `boolean` | нет | `false` | занять всю ширину контейнера |
| `children` | `ReactNode` | нет |  | текст команды или кода |
| `copyText` | `string` | нет |  | что копировать, если это отличается от видимого текста |
| `prompt` | `ReactNode` | нет |  | приглашение перед командой, например `$` |
| `tone` | `"default" \\| "info"` | нет | `'default'` | тон знака приглашения: `default` — цвет акцента, `info` — информационный синий |

## CSS-классы

`jx-snippet`, `jx-snippet--block`, `jx-snippet--info`, `jx-snippet-code`, `jx-snippet-copy`, `jx-snippet-prompt`

## Примеры

### Команда установки

```tsx
<JxSnippet prompt="$" block>
  npm install @jinx-ui/react
</JxSnippet>
```
