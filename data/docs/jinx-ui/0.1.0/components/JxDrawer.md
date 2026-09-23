# JxDrawer

Боковая панель, выезжающая слева или справа поверх страницы, с ловушкой фокуса и закрытием по Escape. Управляется парой `open` и `onOpenChange`; содержимое передаётся как `children`.

Импорт: `import { JxDrawer } from '@jinx-ui/react'`  
Источник: `dist/components/Drawer.d.ts:12`
Ключевые слова: drawer, боковая панель, шторка, sidebar, выезжающая панель, меню навигации, фильтры

## Сигнатура

```tsx
<JxDrawer title: ReactNode; children?: ReactNode; className?: string; defaultOpen?: boolean = false; onOpenChange?: (open: boolean) => void; open?: boolean; side?: JxDrawerSide = 'right' />
```

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `title` | `ReactNode` | да |  | заголовок панели |
| `children` | `ReactNode` | нет |  | содержимое панели |
| `className` | `string` | нет |  | дополнительный класс панели |
| `defaultOpen` | `boolean` | нет | `false` | начальное состояние в неуправляемом режиме |
| `onOpenChange` | `(open: boolean) => void` | нет |  | вызывается с новым состоянием при закрытии |
| `open` | `boolean` | нет |  | открыта ли панель в управляемом режиме |
| `side` | `"right" \| "left"` | нет | `'right'` | с какой стороны выезжает, `right` по умолчанию |

## CSS-классы

`jx-drawer`, `jx-drawer--left`, `jx-drawer--right`, `jx-drawer-body`, `jx-drawer-head`, `jx-drawer-title`, `jx-modal-close`, `jx-modal-overlay`, `jx-modal-overlay--drawer`

## Примеры

### Панель с навигацией

```tsx
function NavigationDrawer({ go, logout }: { go: (path: string) => void; logout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <JxButton variant="ghost" onClick={() => setMenuOpen(true)}>
        Разделы
      </JxButton>
      <JxDrawer open={menuOpen} onOpenChange={setMenuOpen} title="Разделы" side="left">
        <JxMenu
          items={[
            { label: 'Проекты', onSelect: () => go('/projects') },
            { label: 'Команда', onSelect: () => go('/team') },
            { type: 'divider' },
            { label: 'Выйти', danger: true, onSelect: logout },
          ]}
        />
      </JxDrawer>
    </>
  );
}
```
