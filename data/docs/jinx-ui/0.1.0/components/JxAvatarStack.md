# JxAvatarStack

Группа аватаров внахлёст: участники проекта, исполнители задачи, читатели документа. Принимает готовые `JxAvatar` и сдвигает их друг на друга.

Импорт: `import { JxAvatarStack } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Avatar.tsx:42`
Ключевые слова: avatar stack, группа аватаров, участники, наложение

## Сигнатура

```tsx
<JxAvatarStack children?: ReactNode />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | нет |  | аватары участников |

## CSS-классы

`jx-avatar-stack`

## Примеры

### Участники задачи

```tsx
<JxAvatarStack>
  <JxAvatar>ГК</JxAvatar>
  <JxAvatar tone="info">АС</JxAvatar>
  <JxAvatar tone="alt">МП</JxAvatar>
</JxAvatarStack>
```
