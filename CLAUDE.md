# Context Lab

Монорепо на npm workspaces. Библиотека-цель Jinx UI подключена сабмодулем `vendor/jinx-ui`; после клонирования нужен `git submodule update --init`.

## Команды

- `npm run verify` — typecheck, тесты, проверки дрейфа индекса, документации и правил; обязателен перед коммитом.
- `npm run index` и `npm run docs:build` — пересобрать индекс компонентов и AI-документацию после правок в Jinx UI.
- `npm run rules:compile` — пересобрать файлы правил после правок в `rules/`.
- `npm run run -- --task <id> --mode <mode> --driver claude-code` — записать прогон агента; `npm run matrix` собирает матрицу.
- `npm run lab:dev` и `npm run lab:local` — лаборатория на `http://localhost:3000`, второй вариант с локальным драйвером Claude Code.

## Правила

Правила репозитория живут в реестре `rules/` (набор `context-lab` наследует `org`) и компилируются в файлы для агентов. Ниже подключена скомпилированная версия, править нужно источник.

@rules/compiled/context-lab/AGENTS.md
