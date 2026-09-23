# JxButton

Кнопка действия. Пять визуальных вариантов и три размера, всё остальное берётся из атрибутов `<button>`: `type`, `disabled`, `onClick`, `aria-label`. По умолчанию `type="button"`, поэтому для отправки формы задавайте `type="submit"` явно.

Импорт: `import { JxButton } from '@jinx-ui/react'`  
Источник: `dist/components/Button.d.ts:10`
Ключевые слова: кнопка, button, действие, submit, отправить, сохранить, удалить, cta

## Сигнатура

```tsx
<JxButton iconOnly?: boolean = false; ref?: Ref<HTMLButtonElement>; size?: JxButtonSize = 'md'; variant?: JxButtonVariant = 'primary' />
```

Наследует `ButtonHTMLAttributes<HTMLButtonElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `iconOnly` | `boolean` | нет | `false` | квадратная кнопка под одну иконку; обязательно добавьте `aria-label` |
| `ref` | `Ref<HTMLButtonElement>` | нет |  | ссылка на `<button>`, например чтобы поставить на кнопку фокус |
| `size` | `"sm" \| "md" \| "lg"` | нет | `'md'` | размер кнопки, `md` по умолчанию |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "outline" \| "danger"` | нет | `'primary'` | визуальный стиль; `primary` для главного действия, `danger` для разрушительного, `outline` и `ghost` для второстепенных |

## CSS-классы

`jx-btn`, `jx-btn--danger`, `jx-btn--ghost`, `jx-btn--icon`, `jx-btn--lg`, `jx-btn--outline`, `jx-btn--primary`, `jx-btn--secondary`, `jx-btn--sm`

## Примеры

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
