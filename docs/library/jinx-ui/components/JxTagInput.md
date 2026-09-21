---
component: JxTagInput
keywords: [теги, tags, метки, множественный ввод, чипы, ключевые слова]
---
Поле для набора тегов: пользователь вводит текст, Enter добавляет тег, Backspace удаляет последний. Значение — массив строк, управляемое через `value` и `onValueChange` или неуправляемое через `defaultValue`.

## Props
- value: текущий список тегов в управляемом режиме
- defaultValue: начальный список тегов
- onValueChange: вызывается с новым массивом тегов
- placeholder: подсказка в пустом поле
- ariaLabel: доступное имя поля
- className: дополнительный класс корневого элемента

## Examples
### Ключевые слова статьи
```tsx
<JxTagInput ariaLabel="Ключевые слова" placeholder="Введите тег и нажмите Enter" value={tags} onValueChange={setTags} />
```
