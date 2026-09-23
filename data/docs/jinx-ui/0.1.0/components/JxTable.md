# JxTable

Стилизованная таблица. Собственных пропсов нет: это обычный `<table>` с классом библиотеки, поэтому структура `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` пишется руками, а пагинация делается отдельно через `JxPagination`.

Импорт: `import { JxTable } from '@jinx-ui/react'`  
Источник: `dist/components/Table.d.ts:3`
Ключевые слова: table, таблица, список пользователей, строки, колонки, данные

## Сигнатура

```tsx
<JxTable />
```

Наследует `TableHTMLAttributes<HTMLTableElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

Собственных пропсов нет.

## CSS-классы

`jx-table`

## Примеры

### Таблица пользователей

```tsx
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
        <td><JxBadge tone={user.active ? 'success' : 'default'}>{user.active ? 'Активен' : 'Отключён'}</JxBadge></td>
      </tr>
    ))}
  </tbody>
</JxTable>
```
