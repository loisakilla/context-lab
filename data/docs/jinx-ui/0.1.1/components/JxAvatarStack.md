# JxAvatarStack

Группа аватаров внахлёст: участники проекта, исполнители задачи, читатели документа. Принимает готовые `JxAvatar` и сдвигает их друг на друга.

Импорт: `import { JxAvatarStack } from '@jinx-ui/react'`  
Источник: `dist/components/Avatar.d.ts:16`
Ключевые слова: avatar stack, группа аватаров, участники, наложение

## Сигнатура

```tsx
<JxAvatarStack children?: ReactNode; ref?: Ref<HTMLDivElement> />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | нет |  | аватары участников |
| `ref` | `Ref<HTMLDivElement>` | нет |  |  |

## CSS-классы

`jx-avatar-stack`

## Примеры

### Участники задачи

```tsx
<JxAvatarStack>
  <JxAvatar>ГК</JxAvatar>
  <JxAvatar tone="info">АС</JxAvatar>
  <JxAvatar tone="accent">МП</JxAvatar>
</JxAvatarStack>
```
