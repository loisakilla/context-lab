# JxBreadcrumbs

Хлебные крошки: путь от корня раздела до текущей страницы. Элемент без `href` считается текущим и ссылкой не становится.

Импорт: `import { JxBreadcrumbs } from '@jinx-ui/react'`  
Источник: `dist/components/Breadcrumbs.d.ts:11`
Ключевые слова: breadcrumbs, хлебные крошки, навигация, путь, иерархия

## Сигнатура

```tsx
<JxBreadcrumbs items: JxBreadcrumbItem[]; ref?: Ref<HTMLElement>; separator?: ReactNode = '/' />
```

Наследует `HTMLAttributes<HTMLElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxBreadcrumbItem[]` | да |  | элементы пути, каждый с подписью `label` и необязательной ссылкой `href` |
| `ref` | `Ref<HTMLElement>` | нет |  |  |
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
