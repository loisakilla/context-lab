---
component: JxSpinner
keywords: [spinner, спиннер, загрузка, ожидание, индикатор]
---
Индикатор неопределённой загрузки. Если известно, сколько осталось, берите `JxProgress` или `JxProgressCircle`, а если грузится содержимое блока — `JxSkeleton`.

## Props
- variant: вид индикатора: `ring` — кольцо, `dots` — точки
- size: размер в пикселях

## Examples
### Ожидание ответа
```tsx
<JxSpinner variant="ring" size={20} />
```
