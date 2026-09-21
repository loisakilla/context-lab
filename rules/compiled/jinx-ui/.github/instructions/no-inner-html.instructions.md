---
applyTo: "**/*.tsx, **/*.ts"
---
## Без innerHTML

Не используй `innerHTML` и `dangerouslySetInnerHTML`. Текст и разметку передавай через `children` и пропсы типа `ReactNode`; пользовательский ввод считай недоверенным.

<!-- jinx-ui/no-inner-html@1.0.0 -->
