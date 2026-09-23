# JxPagination

Постраничная навигация с кнопками «назад» и «вперёд» и многоточиями для длинных списков. Страницы нумеруются с единицы; `total` — это количество страниц, а не элементов, поэтому его считают заранее: `Math.ceil(items.length / pageSize)`.

Импорт: `import { JxPagination } from '@jinx-ui/react'`  
Источник: `dist/components/Pagination.d.ts:10`
Ключевые слова: pagination, пагинация, страницы, постраничная навигация, таблица, список

## Сигнатура

```tsx
<JxPagination total: number; defaultPage?: number; onPageChange?: (page: number) => void; page?: number; ref?: Ref<HTMLElement>; siblingCount?: number = 1 />
```

Наследует `Omit<HTMLAttributes<HTMLElement>, "onChange">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `total` | `number` | да |  | количество страниц |
| `defaultPage` | `number` | нет |  | начальная страница в неуправляемом режиме |
| `onPageChange` | `(page: number) => void` | нет |  | вызывается с номером выбранной страницы |
| `page` | `number` | нет |  | текущая страница в управляемом режиме, с единицы |
| `ref` | `Ref<HTMLElement>` | нет |  |  |
| `siblingCount` | `number` | нет | `1` | сколько соседних страниц показывать по обе стороны от текущей, 1 по умолчанию |

## CSS-классы

`jx-page-btn`, `jx-page-btn--ghost`, `jx-page-ellipsis`, `jx-pagination`

## Примеры

### Таблица по десять строк

```tsx
const pageSize = 10;

function PagedUsers({ users }: { users: Array<{ id: string; name: string }> }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(users.length / pageSize);
  const visible = users.slice((page - 1) * pageSize, page * pageSize);
  return (
    <>
      <ul>
        {visible.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <JxPagination total={pageCount} page={page} onPageChange={setPage} />
    </>
  );
}
```
