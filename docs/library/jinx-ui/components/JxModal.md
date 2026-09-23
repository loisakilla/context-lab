---
component: JxModal
keywords: [модальное окно, модалка, диалог, dialog, подтверждение, confirm, удалить, popup]
---
Модальное окно с ловушкой фокуса и закрытием по Escape. Управляется парой `open` и `onOpenChange`; кнопки действий передаются как `children`. У окна нет собственной кнопки закрытия, поэтому в `children` всегда должна быть кнопка, которая вызывает `onOpenChange(false)`.

## Props
- open: открыто ли окно в управляемом режиме
- defaultOpen: начальное состояние в неуправляемом режиме
- onOpenChange: вызывается с новым состоянием при закрытии по Escape или клику по подложке
- title: заголовок окна
- message: текст под заголовком
- intent: смысловой тон; `danger` для разрушительных действий, `warning`, `info`, `success`
- icon: иконка рядом с заголовком вместо иконки по умолчанию
- children: содержимое окна, обычно кнопки действий
- className: дополнительный класс окна

## Examples
### Подтверждение удаления
```tsx
function DeleteProject({ removeProject }: { removeProject: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <JxButton variant="danger" onClick={() => setConfirmOpen(true)}>
        Удалить проект
      </JxButton>
      <JxModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        intent="danger"
        title="Удалить проект?"
        message="Проект и все задачи будут удалены безвозвратно."
      >
        <JxButton variant="ghost" onClick={() => setConfirmOpen(false)}>
          Отмена
        </JxButton>
        <JxButton variant="danger" onClick={removeProject}>
          Удалить
        </JxButton>
      </JxModal>
    </>
  );
}
```
