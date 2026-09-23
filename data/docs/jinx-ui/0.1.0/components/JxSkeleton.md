# JxSkeleton

Заглушка на время загрузки: прямоугольник или круг с мерцанием на месте будущего содержимого. Размеры задавайте такими же, как у настоящего блока, иначе вёрстка дёрнется.

Импорт: `import { JxSkeleton } from '@jinx-ui/react'`  
Источник: `dist/components/Skeleton.d.ts:7`
Ключевые слова: skeleton, скелетон, загрузка, заглушка, плейсхолдер

## Сигнатура

```tsx
<JxSkeleton circle?: boolean = false; height?: CSSProperties['height']; width?: CSSProperties['width'] />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `circle` | `boolean` | нет | `false` | сделать заглушку круглой, для аватаров |
| `height` | `CSSProperties['height']` | нет |  | высота заглушки |
| `width` | `CSSProperties['width']` | нет |  | ширина заглушки |

## CSS-классы

`jx-skeleton`

## Примеры

### Загрузка строки списка

```tsx
<div className="jx-row">
  <JxSkeleton width={40} height={40} circle />
  <JxSkeleton width="60%" height={16} />
</div>
```
