---
component: JxPasswordField
keywords: [пароль, password, поле пароля, показать пароль, скрыть пароль, вход, регистрация, подтверждение пароля]
---
Поле пароля с кнопкой «показать / скрыть». Кнопка переключает `type` между `password` и `text` и сообщает своё состояние через `aria-pressed`, поэтому своё переключение видимости писать не нужно. Само поле — обычный `<input>`: `value`, `onChange`, `name`, `autoComplete` и `disabled` передаются напрямую, а `type` задать нельзя — им управляет компонент. По умолчанию стоит `autoComplete="current-password"`; для регистрации передайте `new-password`.

## Props
- label: подпись над полем
- helperText: подсказка под полем, например требования к длине
- errorText: текст ошибки; при наличии поле подсвечивается как невалидное
- required: помечает поле обязательным звёздочкой и атрибутом `required`
- revealLabel: доступное имя кнопки, пока пароль скрыт
- hideLabel: доступное имя кнопки, пока пароль виден
- className: дополнительный класс корневого элемента

## Examples
### Вход
```tsx
function SignInPassword() {
  const [password, setPassword] = useState('');
  return (
    <JxPasswordField
      label="Пароль"
      required
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      revealLabel="Показать пароль"
      hideLabel="Скрыть пароль"
    />
  );
}
```

### Регистрация с подтверждением
```tsx
function NewPassword() {
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  return (
    <>
      <JxPasswordField
        label="Новый пароль"
        autoComplete="new-password"
        helperText="Не короче 12 символов"
        value={next}
        onChange={(event) => setNext(event.target.value)}
      />
      <JxPasswordField
        label="Повторите пароль"
        autoComplete="new-password"
        value={repeat}
        onChange={(event) => setRepeat(event.target.value)}
        errorText={repeat && repeat !== next ? 'Пароли не совпадают' : undefined}
      />
    </>
  );
}
```
