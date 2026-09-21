---
paths: ["apps/lab/**"]
---
## Ключ посетителя не покидает браузер

Ключ Anthropic посетителя хранится только в его браузере и уходит напрямую в api.anthropic.com. Сервер лаборатории не логирует промпты и ключи; iframe превью работает без `allow-same-origin`.

<!-- context-lab/key-stays-in-browser@1.0.0 -->
