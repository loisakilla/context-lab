# JxAlert

Встроенное в разметку сообщение с иконкой, заголовком и текстом. В отличие от `JxToast` не исчезает само и не требует очереди.

Импорт: `import { JxAlert } from '@jinx-ui/react'`  
Источник: `dist/components/Alert.d.ts:9`
Ключевые слова: alert, предупреждение, сообщение, ошибка, info, инлайн-уведомление, баннер

## Сигнатура

```tsx
<JxAlert title: ReactNode & string; children?: ReactNode; icon?: ReactNode; intent?: JxAlertIntent = 'info' />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `title` | `ReactNode & string` | да |  | заголовок сообщения |
| `children` | `ReactNode` | нет |  | текст сообщения |
| `icon` | `ReactNode` | нет |  | своя иконка вместо иконки тона |
| `intent` | `"danger" \| "warning" \| "info" \| "success"` | нет | `'info'` | тон: `info` по умолчанию, `success`, `warning`, `danger` |

## CSS-классы

`jx-alert`, `jx-alert--danger`, `jx-alert--info`, `jx-alert--success`, `jx-alert--warning`, `jx-alert-body`, `jx-alert-icon`, `jx-alert-msg`, `jx-alert-title`

## Примеры

### Предупреждение перед действием

```tsx
<JxAlert intent="warning" title="Нельзя отменить">
  После архивации проект пропадёт из списка активных.
</JxAlert>
```
