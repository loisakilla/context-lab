---
component: JxDrawer
keywords: [drawer, боковая панель, шторка, sidebar, выезжающая панель, меню навигации, фильтры]
---
Боковая панель, выезжающая слева или справа поверх страницы, с ловушкой фокуса и закрытием по Escape. Управляется парой `open` и `onOpenChange`; содержимое передаётся как `children`.

## Props
- open: открыта ли панель в управляемом режиме
- defaultOpen: начальное состояние в неуправляемом режиме
- onOpenChange: вызывается с новым состоянием при закрытии
- title: заголовок панели
- side: с какой стороны выезжает, `right` по умолчанию
- children: содержимое панели
- className: дополнительный класс панели

## Examples
### Панель с навигацией
```tsx
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
```
