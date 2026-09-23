---
component: JxMenu
keywords: [menu, меню, список действий, навигация, контекстное меню, пункты]
---
Вертикальное меню действий. Пункты описываются массивом `JxMenuItem`: обычный пункт с `label` и `onSelect`, разделитель `{ type: 'divider' }` и подпись группы `{ type: 'label', label }`. Опасные действия помечаются `danger`, недоступные — `disabled`.

## Props
- items: пункты меню `{ type?, label?, icon?, shortcut?, danger?, onSelect?, disabled? }`

## Examples
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
