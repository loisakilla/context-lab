---
id: one-tool-implementation
version: 1.0.0
title: Одна реализация инструментов
applies_to: ["packages/**"]
priority: 80
---
Инструменты поиска и выдачи API живут в `@context-lab/index-tools` и обслуживают одновременно MCP-сервер и браузерный tool use. Не дублируй их логику в других пакетах.
