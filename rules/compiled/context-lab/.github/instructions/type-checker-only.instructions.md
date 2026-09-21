---
applyTo: "packages/docgen/**"
---
## Пропсы только через type checker

Пропсы компонентов извлекай только через TypeScript Compiler API с настоящим `ts.Program` и type checker. Синтаксический разбор без проверки типов не используй: он ломается на пересечениях, обёртках React и наследовании.

<!-- context-lab/type-checker-only@1.0.0 -->
