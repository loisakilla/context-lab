# JxAvatar

Импорт: `import { JxAvatar } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Avatar.tsx:26`

## Сигнатура

```tsx
<JxAvatar children?: ReactNode; size?: JxAvatarSize = 'md'; status?: boolean = false; tone?: JxAvatarTone = 'default' />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | нет |  |  |
| `size` | `"sm" \\| "md" \\| "lg"` | нет | `'md'` |  |
| `status` | `boolean` | нет | `false` |  |
| `tone` | `"alt" \\| "default" \\| "info" \\| "accent"` | нет | `'default'` |  |

## CSS-классы

`jx-avatar`, `jx-avatar--accent`, `jx-avatar--alt`, `jx-avatar--info`, `jx-avatar--lg`, `jx-avatar--sm`, `jx-avatar-status`
