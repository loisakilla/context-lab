---
component: JxBadge
keywords: [badge, бейдж, статус, метка, счётчик, индикатор]
---
Небольшая метка статуса или счётчика. Тон задаёт цвет из токенов, `dot` добавляет точку-индикатор перед текстом.

## Props
- children: текст метки
- tone: цветовой тон: `default`, `accent`, `alt`, `success`, `warning`, `danger`, `info`, `solid`
- dot: показать точку-индикатор

## Examples
### Статусы в таблице
```tsx
<JxBadge tone="success" dot>Активен</JxBadge>
<JxBadge tone="warning">Ожидает</JxBadge>
```
