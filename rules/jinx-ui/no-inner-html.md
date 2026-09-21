---
id: no-inner-html
version: 1.0.0
title: Без innerHTML
applies_to: ["**/*.tsx", "**/*.ts"]
priority: 95
---
Не используй `innerHTML` и `dangerouslySetInnerHTML`. Текст и разметку передавай через `children` и пропсы типа `ReactNode`; пользовательский ввод считай недоверенным.
