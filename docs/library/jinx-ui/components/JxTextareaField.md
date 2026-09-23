---
component: JxTextareaField
keywords: [textarea, многострочное поле, комментарий, описание, сообщение]
---
Многострочное поле с подписью, подсказкой и текстом ошибки. Принимает все атрибуты `<textarea>`: `rows`, `value`, `onChange`, `placeholder`, `maxLength`.

## Props
- label: подпись над полем
- helperText: подсказка под полем
- errorText: текст ошибки; при наличии поле подсвечивается как невалидное
- required: помечает поле обязательным
- className: дополнительный класс корневого элемента
- ref: ссылка на `<textarea>`

## Examples
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
