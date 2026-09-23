# JxSwitch

Переключатель «включено/выключено» с подписью. Внутри обычный `<input type="checkbox">`, поэтому состояние задаётся через `checked` и `onChange`, а имя для формы через `name`.

Импорт: `import { JxSwitch } from '@jinx-ui/react'`  
Источник: `dist/components/Switch.d.ts:6`
Ключевые слова: switch, переключатель, тумблер, включить, выключить, уведомления, настройка

## Сигнатура

```tsx
<JxSwitch label?: ReactNode; wrapClassName?: string />
```

Наследует `Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `label` | `ReactNode` | нет |  | подпись справа от переключателя |
| `wrapClassName` | `string` | нет |  | класс на обёртке с подписью |

## CSS-классы

`jx-switch`, `jx-switch-slider`

## Примеры

### Настройка уведомлений

```tsx
function EmailNotifications() {
  const [notifications, setNotifications] = useState(true);
  return (
    <JxSwitch
      label="Присылать уведомления на почту"
      checked={notifications}
      onChange={(event) => setNotifications(event.target.checked)}
    />
  );
}
```
