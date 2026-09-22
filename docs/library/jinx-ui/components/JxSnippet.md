---
component: JxSnippet
keywords: [snippet, код, команда, копировать, терминал]
---
Блок кода или команды с кнопкой копирования. `prompt` рисует приглашение терминала, `block` разворачивает сниппет на всю ширину.

## Props
- children: текст команды или кода
- prompt: приглашение перед командой, например `$`
- tone: тон блока: `default`, `accent`, `alt`, `info`
- block: занять всю ширину контейнера
- copyText: что копировать, если это отличается от видимого текста

## Examples
### Команда установки
```tsx
<JxSnippet prompt="$" block>
  npm install @jinx-ui/react
</JxSnippet>
```
