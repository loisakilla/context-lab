# Context Lab

Монорепо на npm workspaces. Библиотека-цель Jinx UI подключена npm-пакетами `@jinx-ui/*` с точной версией — в корневом `package.json` и в `apps/lab`. Индекс и документация читают установленный пакет из `node_modules`: типы из `.d.ts`, дефолты и CSS-классы из `.js`.

## Команды

- `npm run verify` — typecheck, тесты, проверки дрейфа индекса, документации и правил; обязателен перед коммитом.
- `npm run index` и `npm run docs:build` — пересобрать индекс компонентов и AI-документацию после смены версии Jinx UI.
- `npm run matrix -- --library <версия>` — собрать матрицу по прогонам одной версии библиотеки; смешивать версии матрица отказывается.
- `npm run rules:compile` — пересобрать файлы правил после правок в `rules/`.
- `npm run run -- --task <id> --mode <mode> --driver claude-code` — записать прогон агента; `npm run matrix` собирает матрицу.
- `npm run prompts` и `npm run record` — выгрузить задания по ячейкам и собрать записи из ответов в `data/outputs`, когда прогон делается без CLI.
- `npm run lab:dev` и `npm run lab:local` — лаборатория на `http://localhost:3000`, второй вариант с локальным драйвером Claude Code.

## Правила

Правила репозитория живут в реестре `rules/` (набор `context-lab` наследует `org`) и компилируются в файлы для агентов. Ниже подключена скомпилированная версия, править нужно источник.

@rules/compiled/context-lab/AGENTS.md
