---
id: tests-required
version: 1.0.0
title: Логика приходит с тестами
applies_to: ["packages/**"]
priority: 60
---
Новая логика в `packages/*` приходит с тестами на vitest. MCP-сервер проверяется сквозным тестом через настоящий stdio-клиент из SDK. Перед коммитом прогоняй `npm run verify`.
