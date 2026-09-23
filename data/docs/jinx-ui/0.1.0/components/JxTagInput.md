# JxTagInput

Поле для набора тегов: пользователь вводит текст, Enter добавляет тег, Backspace удаляет последний. Значение — массив строк, управляемое через `value` и `onValueChange` или неуправляемое через `defaultValue`.

Импорт: `import { JxTagInput } from '@jinx-ui/react'`  
Источник: `dist/components/TagInput.d.ts:9`
Ключевые слова: теги, tags, метки, множественный ввод, чипы, ключевые слова

## Сигнатура

```tsx
<JxTagInput ariaLabel?: string; className?: string; defaultValue?: string[]; onValueChange?: (value: string[]) => void; placeholder?: string = 'Add tag…'; value?: string[] />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `ariaLabel` | `string` | нет |  | доступное имя поля |
| `className` | `string` | нет |  | дополнительный класс корневого элемента |
| `defaultValue` | `string[]` | нет |  | начальный список тегов |
| `onValueChange` | `(value: string[]) => void` | нет |  | вызывается с новым массивом тегов |
| `placeholder` | `string` | нет | `'Add tag…'` | подсказка в пустом поле |
| `value` | `string[]` | нет |  | текущий список тегов в управляемом режиме |

## CSS-классы

`jx-chip-x`, `jx-taginput`

## Примеры

### Ключевые слова статьи

```tsx
<JxTagInput ariaLabel="Ключевые слова" placeholder="Введите тег и нажмите Enter" value={tags} onValueChange={setTags} />
```
