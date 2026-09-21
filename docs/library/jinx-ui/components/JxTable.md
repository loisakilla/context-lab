---
component: JxTable
keywords: [table, таблица, список пользователей, строки, колонки, данные]
---
Стилизованная таблица. Собственных пропсов нет: это обычный `<table>` с классом библиотеки, поэтому структура `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` пишется руками, а пагинация делается отдельно через `JxPagination`.

## Props

## Examples
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
