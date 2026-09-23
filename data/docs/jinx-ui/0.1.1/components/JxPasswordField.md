# JxPasswordField

Поле пароля с кнопкой «показать / скрыть». Кнопка переключает `type` между `password` и `text` и сообщает своё состояние через `aria-pressed`, поэтому своё переключение видимости писать не нужно. Само поле — обычный `<input>`: `value`, `onChange`, `name`, `autoComplete` и `disabled` передаются напрямую, а `type` задать нельзя — им управляет компонент. По умолчанию стоит `autoComplete="current-password"`; для регистрации передайте `new-password`.

Импорт: `import { JxPasswordField } from '@jinx-ui/react'`  
Источник: `dist/components/Fields.d.ts:19`
Ключевые слова: пароль, password, поле пароля, показать пароль, скрыть пароль, вход, регистрация, подтверждение пароля

## Сигнатура

```tsx
<JxPasswordField className?: string; errorText?: string; helperText?: string; hideLabel?: string = 'Hide password'; label?: string; ref?: Ref<HTMLInputElement>; required?: boolean; revealLabel?: string = 'Show password' />
```

Наследует `Omit<InputHTMLAttributes<HTMLInputElement>, "type">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `errorText` | `string` | нет |  | текст ошибки; при наличии поле подсвечивается как невалидное |
| `helperText` | `string` | нет |  | подсказка под полем, например требования к длине |
| `hideLabel` | `string` | нет | `'Hide password'` | доступное имя кнопки, пока пароль виден |
| `label` | `string` | нет |  | подпись над полем |
| `ref` | `Ref<HTMLInputElement>` | нет |  | ссылка на `<input>` |
| `required` | `boolean` | нет |  | помечает поле обязательным звёздочкой и атрибутом `required` |
| `revealLabel` | `string` | нет | `'Show password'` | доступное имя кнопки, пока пароль скрыт |

## CSS-классы

`jx-field`, `jx-field--error`, `jx-input`, `jx-input-action`, `jx-input-error`, `jx-input-group`, `jx-input-help`, `jx-label`, `jx-label-req`

## Примеры

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
