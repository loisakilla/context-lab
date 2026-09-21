---
id: compiler-checks
version: 1.0.0
title: Проверки делает компилятор
applies_to: ["packages/checks/**", "packages/runner/**"]
priority: 70
---
Сгенерированный код проверяет `@context-lab/checks` на `typescript` и `@typescript/vfs`. Не заменяй проверку типов регулярными выражениями по коду; линтер только дополняет компилятор.
