# JxTooltip

Всплывающая подсказка к элементу: появляется при наведении и фокусе. Подсказка дополняет интерфейс, но не заменяет подпись — важный текст выносите на страницу.

Импорт: `import { JxTooltip } from '@jinx-ui/react'`  
Источник: `dist/components/Tooltip.d.ts:6`
Ключевые слова: tooltip, подсказка, всплывающая подсказка, пояснение, hover

## Сигнатура

```tsx
<JxTooltip children: ReactNode; tip: ReactNode />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | да |  | элемент, к которому привязана подсказка |
| `tip` | `ReactNode` | да |  | текст подсказки |

## CSS-классы

`jx-tooltip`, `jx-tooltip-tip`

## Примеры

### Пояснение к кнопке

```tsx
<JxTooltip tip="Запустить прогон в выбранном режиме">
  <JxButton variant="primary">Запустить</JxButton>
</JxTooltip>
```
