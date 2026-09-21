---
id: source-exports
version: 1.0.0
title: Пакеты экспортируют исходники
applies_to: ["packages/**/package.json"]
priority: 50
---
Пакеты монорепо экспортируют исходники (`exports: ./src/index.ts`); сборка в `dist` нужна только публикуемым пакетам. Относительные импорты внутри пакетов пишутся с расширением `.ts`.
