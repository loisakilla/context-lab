# JxBreadcrumbs

Хлебные крошки: путь от корня раздела до текущей страницы. Элемент без `href` считается текущим и ссылкой не становится.

Импорт: `import { JxBreadcrumbs } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Breadcrumbs.tsx:15`
Ключевые слова: breadcrumbs, хлебные крошки, навигация, путь, иерархия

## Сигнатура

```tsx
<JxBreadcrumbs items: JxBreadcrumbItem[]; separator?: ReactNode = '/' />
```

Наследует `HTMLAttributes<HTMLElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxBreadcrumbItem[]` | да |  | элементы пути, каждый с подписью `label` и необязательной ссылкой `href` |
| `separator` | `ReactNode` | нет | `'/'` | разделитель между элементами, по умолчанию стрелка |

## CSS-классы

`jx-breadcrumbs`

## Примеры

### Путь до настроек проекта

```tsx
<JxBreadcrumbs
  items={[
    { label: 'Проекты', href: '/projects' },
    { label: 'Контекст', href: '/projects/context' },
    { label: 'Настройки' },
  ]}
/>
```
