# JxTextareaField

Многострочное поле с подписью, подсказкой и текстом ошибки. Принимает все атрибуты `<textarea>`: `rows`, `value`, `onChange`, `placeholder`, `maxLength`.

Импорт: `import { JxTextareaField } from '@jinx-ui/react'`  
Источник: `dist/components/Fields.d.ts:19`
Ключевые слова: textarea, многострочное поле, комментарий, описание, сообщение

## Сигнатура

```tsx
<JxTextareaField className?: string; errorText?: string; helperText?: string; label?: string; required?: boolean />
```

Наследует `TextareaHTMLAttributes<HTMLTextAreaElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `errorText` | `string` | нет |  | текст ошибки; при наличии поле подсвечивается как невалидное |
| `helperText` | `string` | нет |  | подсказка под полем |
| `label` | `string` | нет |  | подпись над полем |
| `required` | `boolean` | нет |  | помечает поле обязательным |

## CSS-классы

`jx-field`, `jx-field--error`, `jx-input-error`, `jx-input-help`, `jx-label`, `jx-label-req`, `jx-textarea`

## Примеры

### Комментарий с ограничением длины

```tsx
function CommentField() {
  const [comment, setComment] = useState('');
  return (
    <JxTextareaField
      label="Комментарий"
      rows={4}
      maxLength={500}
      value={comment}
      onChange={(event) => setComment(event.target.value)}
      helperText={`${comment.length}/500`}
    />
  );
}
```
