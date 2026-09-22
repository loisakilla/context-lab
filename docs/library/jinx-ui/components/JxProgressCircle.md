---
component: JxProgressCircle
keywords: [progress circle, круговой прогресс, индикатор, проценты, загрузка]
---
Круговой индикатор прогресса для компактных мест: карточек, плиток, строк таблицы. Для полосы во всю ширину есть `JxProgress`.

## Props
- value: текущее значение
- max: максимум шкалы, по умолчанию 100
- showValue: показать проценты в центре круга

## Examples
### Заполненность квоты
```tsx
<JxProgressCircle value={72} showValue />
```
