# JxInputField

Текстовое поле с подписью, подсказкой и текстом ошибки. Само поле — обычный `<input>`, поэтому `value`, `onChange`, `placeholder`, `type`, `name` и `disabled` передаются напрямую.

Импорт: `import { JxInputField } from '@jinx-ui/react'`  
Источник: `dist/components/Fields.d.ts:13`
Ключевые слова: поле ввода, input, текстовое поле, форма, имя, email, телефон, ошибка валидации

## Сигнатура

```tsx
<JxInputField className?: string; errorText?: string; helperText?: string; label?: string; prefix?: string; ref?: Ref<HTMLInputElement>; required?: boolean />
```

Наследует `InputHTMLAttributes<HTMLInputElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `errorText` | `string` | нет |  | текст ошибки; при наличии поле подсвечивается как невалидное |
| `helperText` | `string` | нет |  | подсказка под полем |
| `label` | `string` | нет |  | подпись над полем |
| `prefix` | `string` | нет |  | короткий текст слева от значения, например `https://` или `+7` |
| `ref` | `Ref<HTMLInputElement>` | нет |  | ссылка на `<input>`, например чтобы вернуть фокус в поле после ошибки |
| `required` | `boolean` | нет |  | помечает поле обязательным звёздочкой и атрибутом `required` |

## CSS-классы

`jx-field`, `jx-field--error`, `jx-input`, `jx-input-error`, `jx-input-group`, `jx-input-group-affix`, `jx-input-help`, `jx-label`, `jx-label-req`

## Примеры

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
