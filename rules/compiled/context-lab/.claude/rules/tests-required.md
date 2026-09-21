---
paths: ["packages/**"]
---
## Логика приходит с тестами

Новая логика в `packages/*` приходит с тестами на vitest. MCP-сервер проверяется сквозным тестом через настоящий stdio-клиент из SDK. Перед коммитом прогоняй `npm run verify`.

<!-- context-lab/tests-required@1.0.0 -->
