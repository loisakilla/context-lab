# JxAvatar

Аватар пользователя: инициалы или изображение внутри круга. Тон задаёт цвет фона из токенов, `status` добавляет точку присутствия в углу.

Импорт: `import { JxAvatar } from '@jinx-ui/react'`  
Источник: `dist/components/Avatar.d.ts:10`
Ключевые слова: avatar, аватар, пользователь, инициалы, фото профиля

## Сигнатура

```tsx
<JxAvatar children?: ReactNode; size?: JxAvatarSize = 'md'; status?: boolean = false; tone?: JxAvatarTone = 'default' />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | нет |  | инициалы или изображение внутри аватара |
| `size` | `"sm" \| "md" \| "lg"` | нет | `'md'` | размер: `sm`, `md`, `lg` |
| `status` | `boolean` | нет | `false` | показать точку присутствия |
| `tone` | `"default" \| "info" \| "accent"` | нет | `'default'` | цветовой тон фона: `default`, `accent`, `info` |

## CSS-классы

`jx-avatar`, `jx-avatar--accent`, `jx-avatar--info`, `jx-avatar--lg`, `jx-avatar--sm`, `jx-avatar-status`

## Примеры

### Аватар с индикатором присутствия

```tsx
<JxAvatar tone="accent" size="md" status>
  ГК
</JxAvatar>
```
