# JxModal

Модальное окно с ловушкой фокуса и закрытием по Escape. Управляется парой `open` и `onOpenChange`; кнопки действий передаются как `children`. У окна нет собственной кнопки закрытия, поэтому в `children` всегда должна быть кнопка, которая вызывает `onOpenChange(false)`.

Импорт: `import { JxModal } from '@jinx-ui/react'`  
Источник: `dist/components/Modal.d.ts:14`
Ключевые слова: модальное окно, модалка, диалог, dialog, подтверждение, confirm, удалить, popup

## Сигнатура

```tsx
<JxModal title: ReactNode; children?: ReactNode; className?: string; defaultOpen?: boolean = false; icon?: ReactNode; intent?: JxModalIntent = 'default'; message?: ReactNode; onOpenChange?: (open: boolean) => void; open?: boolean />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `title` | `ReactNode` | да |  | заголовок окна |
| `children` | `ReactNode` | нет |  | содержимое окна, обычно кнопки действий |
| `className` | `string` | нет |  | дополнительный класс окна |
| `defaultOpen` | `boolean` | нет | `false` | начальное состояние в неуправляемом режиме |
| `icon` | `ReactNode` | нет |  | иконка рядом с заголовком вместо иконки по умолчанию |
| `intent` | `"danger" \\| "default" \\| "warning" \\| "info" \\| "success"` | нет | `'default'` | смысловой тон; `danger` для разрушительных действий, `warning`, `info`, `success` |
| `message` | `ReactNode` | нет |  | текст под заголовком |
| `onOpenChange` | `(open: boolean) => void` | нет |  | вызывается с новым состоянием при закрытии по Escape или клику по подложке |
| `open` | `boolean` | нет |  | открыто ли окно в управляемом режиме |

## CSS-классы

`jx-modal-actions`, `jx-modal-close`, `jx-modal-frame`, `jx-modal-icon`, `jx-modal-msg`, `jx-modal-title`

## Примеры

### Подтверждение удаления

```tsx
<JxModal
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  intent="danger"
  title="Удалить проект?"
  message="Проект и все задачи будут удалены безвозвратно."
>
  <JxButton variant="ghost" onClick={() => setConfirmOpen(false)}>Отмена</JxButton>
  <JxButton variant="danger" onClick={removeProject}>Удалить</JxButton>
</JxModal>
```
