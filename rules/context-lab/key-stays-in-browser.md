---
id: key-stays-in-browser
version: 1.0.0
title: Ключ посетителя не покидает браузер
applies_to: ["apps/lab/**"]
priority: 95
---
Ключ Anthropic посетителя хранится только в его браузере и уходит напрямую в api.anthropic.com. Сервер лаборатории не логирует промпты и ключи; iframe превью работает без `allow-same-origin`.
