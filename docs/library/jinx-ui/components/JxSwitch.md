---
component: JxSwitch
keywords: [switch, переключатель, тумблер, включить, выключить, уведомления, настройка]
---
Переключатель «включено/выключено» с подписью. Внутри обычный `<input type="checkbox">`, поэтому состояние задаётся через `checked` и `onChange`, а имя для формы через `name`.

## Props
- label: подпись справа от переключателя
- wrapClassName: класс на обёртке с подписью

## Examples
### Настройка уведомлений
```tsx
<JxSwitch
  label="Присылать уведомления на почту"
  checked={notifications}
  onChange={(event) => setNotifications(event.target.checked)}
/>
```
