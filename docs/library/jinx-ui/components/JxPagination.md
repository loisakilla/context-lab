---
component: JxPagination
keywords: [pagination, пагинация, страницы, постраничная навигация, таблица, список]
---
Постраничная навигация с кнопками «назад» и «вперёд» и многоточиями для длинных списков. Страницы нумеруются с единицы; `total` — это количество страниц, а не элементов, поэтому его считают заранее: `Math.ceil(items.length / pageSize)`.

## Props
- total: количество страниц
- page: текущая страница в управляемом режиме, с единицы
- defaultPage: начальная страница в неуправляемом режиме
- onPageChange: вызывается с номером выбранной страницы
- siblingCount: сколько соседних страниц показывать по обе стороны от текущей, 1 по умолчанию

## Examples
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
