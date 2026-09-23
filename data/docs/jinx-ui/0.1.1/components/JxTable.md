# JxTable

Стилизованная таблица. Собственных пропсов нет: это обычный `<table>` с классом библиотеки, поэтому структура `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` пишется руками, а пагинация делается отдельно через `JxPagination`.

Импорт: `import { JxTable } from '@jinx-ui/react'`  
Источник: `dist/components/Table.d.ts:5`
Ключевые слова: table, таблица, список пользователей, строки, колонки, данные

## Сигнатура

```tsx
<JxTable ref?: Ref<HTMLTableElement> />
```

Наследует `TableHTMLAttributes<HTMLTableElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `ref` | `Ref<HTMLTableElement>` | нет |  |  |

## CSS-классы

`jx-table`

## Примеры

### Таблица пользователей

```tsx
interface User {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <JxTable>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Роль</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.role}</td>
            <td>
              <JxBadge tone={user.active ? 'success' : 'default'}>{user.active ? 'Активен' : 'Отключён'}</JxBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </JxTable>
  );
}
```
