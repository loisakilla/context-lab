# JxEmptyState

Пустое состояние списка или раздела: что здесь появится и что для этого сделать. Ставьте вместо пустой таблицы или нулевого счётчика.

Импорт: `import { JxEmptyState } from '@jinx-ui/react'`  
Источник: `dist/components/EmptyState.d.ts:9`
Ключевые слова: empty state, пустой экран, нет данных, заглушка, первый запуск

## Сигнатура

```tsx
<JxEmptyState title: ReactNode & string; action?: ReactNode; icon?: ReactNode; message?: ReactNode; ref?: Ref<HTMLDivElement> />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `title` | `ReactNode & string` | да |  | заголовок пустого состояния |
| `action` | `ReactNode` | нет |  | кнопка основного действия |
| `icon` | `ReactNode` | нет |  | иллюстрация или иконка над заголовком |
| `message` | `ReactNode` | нет |  | пояснение под заголовком |
| `ref` | `Ref<HTMLDivElement>` | нет |  |  |

## CSS-классы

`jx-empty`, `jx-empty-icon`, `jx-empty-msg`, `jx-empty-title`

## Примеры

### Пустой список проектов

```tsx
<JxEmptyState
  title="Проектов пока нет"
  message="Создайте первый проект, чтобы начать работу."
  action={<JxButton variant="primary">Создать проект</JxButton>}
/>
```
