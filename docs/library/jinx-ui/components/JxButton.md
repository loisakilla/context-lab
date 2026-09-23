---
component: JxButton
keywords: [кнопка, button, действие, submit, отправить, сохранить, удалить, cta]
---
Кнопка действия. Пять визуальных вариантов и три размера, всё остальное берётся из атрибутов `<button>`: `type`, `disabled`, `onClick`, `aria-label`. По умолчанию `type="button"`, поэтому для отправки формы задавайте `type="submit"` явно.

## Props
- variant: визуальный стиль; `primary` для главного действия, `danger` для разрушительного, `outline` и `ghost` для второстепенных
- size: размер кнопки, `md` по умолчанию
- iconOnly: квадратная кнопка под одну иконку; обязательно добавьте `aria-label`

## Examples
### Главное и второстепенное действие
```tsx
<div style={{ display: 'flex', gap: 'var(--jx-gap, 8px)' }}>
  <JxButton variant="primary" type="submit">Сохранить</JxButton>
  <JxButton variant="ghost" type="button">Отмена</JxButton>
</div>
```

### Разрушительное действие с блокировкой
```tsx
function DeleteProjectButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <JxButton variant="danger" size="sm" disabled={isDeleting} onClick={remove}>
      Удалить
    </JxButton>
  );
}
```
