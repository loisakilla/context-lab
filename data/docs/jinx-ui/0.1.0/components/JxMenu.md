# JxMenu

Вертикальное меню действий. Пункты описываются массивом `JxMenuItem`: обычный пункт с `label` и `onSelect`, разделитель `{ type: 'divider' }` и подпись группы `{ type: 'label', label }`. Опасные действия помечаются `danger`, недоступные — `disabled`.

Импорт: `import { JxMenu } from '@jinx-ui/react'`  
Источник: `dist/components/Menu.d.ts:14`
Ключевые слова: menu, меню, список действий, навигация, контекстное меню, пункты

## Сигнатура

```tsx
<JxMenu items: JxMenuItem[] />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxMenuItem[]` | да |  | пункты меню `{ type?, label?, icon?, shortcut?, danger?, onSelect?, disabled? }` |

## CSS-классы

`jx-menu-divider`, `jx-menu-item`, `jx-menu-item--danger`, `jx-menu-item-shortcut`, `jx-menu-label`, `jx-menu-panel`

## Примеры

### Меню действий над проектом

```tsx
function ProjectActions({ rename, duplicate, remove }: { rename: () => void; duplicate: () => void; remove: () => void }) {
  return (
    <JxMenu
      items={[
        { type: 'label', label: 'Проект' },
        { label: 'Переименовать', shortcut: 'F2', onSelect: rename },
        { label: 'Дублировать', onSelect: duplicate },
        { type: 'divider' },
        { label: 'Удалить', danger: true, onSelect: remove },
      ]}
    />
  );
}
```
