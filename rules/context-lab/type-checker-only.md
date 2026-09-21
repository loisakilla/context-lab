---
id: type-checker-only
version: 1.0.0
title: Пропсы только через type checker
applies_to: ["packages/docgen/**"]
priority: 90
---
Пропсы компонентов извлекай только через TypeScript Compiler API с настоящим `ts.Program` и type checker. Синтаксический разбор без проверки типов не используй: он ломается на пересечениях, обёртках React и наследовании.
