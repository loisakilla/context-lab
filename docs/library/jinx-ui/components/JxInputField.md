---
component: JxInputField
keywords: [поле ввода, input, текстовое поле, форма, имя, email, телефон, ошибка валидации]
---
Текстовое поле с подписью, подсказкой и текстом ошибки. Само поле — обычный `<input>`, поэтому `value`, `onChange`, `placeholder`, `type`, `name` и `disabled` передаются напрямую.

## Props
- label: подпись над полем
- helperText: подсказка под полем
- errorText: текст ошибки; при наличии поле подсвечивается как невалидное
- required: помечает поле обязательным звёздочкой и атрибутом `required`
- prefix: короткий текст слева от значения, например `https://` или `+7`
- className: дополнительный класс корневого элемента

## Examples
### Обязательное поле с ошибкой
```tsx
function EmailField() {
  const [email, setEmail] = useState('');
  const emailError = email.length > 0 && !email.includes('@') ? 'Укажите адрес с символом @' : undefined;
  return (
    <JxInputField
      label="Электронная почта"
      type="email"
      required
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      errorText={emailError}
    />
  );
}
```

### Поле с префиксом и подсказкой
```tsx
<JxInputField label="Сайт" prefix="https://" placeholder="example.com" helperText="Без протокола" />
```
