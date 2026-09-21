---
id: controlled-state
version: 1.0.0
title: Управляемое состояние снаружи
task_types: [ui, refactor]
priority: 60
---
Состояние компонентов держи снаружи через пары `value`/`onValueChange` и `open`/`onOpenChange`. Неуправляемый режим включай только через `defaultValue` и `defaultOpen`; внутри библиотеки оба режима реализует хук `useControllableState`.
