# Токены дизайн-системы

Используйте `var(--токен)` вместо значений: цвета меняются по `data-theme`, радиусы по `data-style`.

## color

| Токен | Значение | Переопределения |
|---|---|---|
| `--jx-accent` | `#c9a3ff` | `[data-theme="light"]`: `#7747d4`; `[data-style="brutal"]`: `#1a1726`; `[data-style="brutal"][data-theme="dark"]`: `#f5ff3d` |
| `--jx-accent-2` | `#d4ff3d` | `[data-theme="light"]`: `#859e00` |
| `--jx-accent-2-ink` | `#0c0a14` | `[data-theme="light"]`: `#fff` |
| `--jx-accent-ink` | `#0c0a14` | `[data-theme="light"]`: `#fff`; `[data-style="brutal"]`: `#f5ff3d`; `[data-style="brutal"][data-theme="dark"]`: `#1a1726` |
| `--jx-accent-soft` | `rgba(201, 163, 255, 0.14)` | `[data-theme="light"]`: `rgba(119, 71, 212, 0.12)`; `[data-style="brutal"]`: `rgba(26, 23, 38, 0.08)`; `[data-style="brutal"][data-theme="dark"]`: `rgba(245, 255, 61, 0.14)` |
| `--jx-bg` | `#0c0a14` | `[data-theme="light"]`: `#f5f2e9`; `[data-style="brutal"]`: `#f5f2e9`; `[data-style="brutal"][data-theme="dark"]`: `#1a1726` |
| `--jx-bg-2` | `#0f0d18` | `[data-theme="light"]`: `#ece8dc`; `[data-style="brutal"]`: `#ece8dc`; `[data-style="brutal"][data-theme="dark"]`: `#0c0a14` |
| `--jx-border` | `#221c30` | `[data-theme="light"]`: `#ddd6c4`; `[data-style="brutal"]`: `#1a1726`; `[data-style="brutal"][data-theme="dark"]`: `#f5ff3d` |
| `--jx-border-2` | `#3a3150` | `[data-theme="light"]`: `#b8ae96`; `[data-style="brutal"]`: `#1a1726`; `[data-style="brutal"][data-theme="dark"]`: `#f5ff3d` |
| `--jx-danger` | `#ff5470` | `[data-theme="light"]`: `#c81e3c` |
| `--jx-info` | `#79c8ff` | `[data-theme="light"]`: `#1d5fb0` |
| `--jx-rule` | `#1c1828` | `[data-theme="light"]`: `#ddd6c4`; `[data-style="brutal"]`: `#1a1726`; `[data-style="brutal"][data-theme="dark"]`: `#f5ff3d` |
| `--jx-success` | `#6bd97a` | `[data-theme="light"]`: `#1f7a45` |
| `--jx-surface` | `#15121f` | `[data-theme="light"]`: `#ffffff`; `[data-style="brutal"]`: `#ffffff`; `[data-style="brutal"][data-theme="dark"]`: `#1a1726` |
| `--jx-surface-2` | `#1c1828` | `[data-theme="light"]`: `#f5f1e6`; `[data-style="brutal"]`: `#f0ebdb`; `[data-style="brutal"][data-theme="dark"]`: `#0c0a14` |
| `--jx-surface-3` | `#2a2438` | `[data-theme="light"]`: `#e6e0d0`; `[data-style="brutal"]`: `#ddd6c4` |
| `--jx-text` | `#f0ecf5` | `[data-theme="light"]`: `#1a1726`; `[data-style="brutal"]`: `#1a1726`; `[data-style="brutal"][data-theme="dark"]`: `#f5ff3d` |
| `--jx-text-2` | `#a59cb8` | `[data-theme="light"]`: `#4a4258`; `[data-style="brutal"]`: `#1a1726`; `[data-style="brutal"][data-theme="dark"]`: `#f5ff3d` |
| `--jx-text-3` | `#6e6386` | `[data-theme="light"]`: `#7a7187`; `[data-style="brutal"][data-theme="dark"]`: `#a59cb8` |
| `--jx-text-4` | `#463e5a` | `[data-theme="light"]`: `#b4abc0`; `[data-style="brutal"]`: `#b4abc0` |
| `--jx-warning` | `#ffb547` | `[data-theme="light"]`: `#9a6300` |

## font

| Токен | Значение | Переопределения |
|---|---|---|
| `--jx-font-display` | `"Fraunces", ui-serif, serif` |  |
| `--jx-font-mono` | `"JetBrains Mono", ui-monospace, monospace` |  |
| `--jx-font-sans` | `"Inter Tight", system-ui, sans-serif` |  |

## motion

| Токен | Значение | Переопределения |
|---|---|---|
| `--jx-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` |  |
| `--jx-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |  |

## radius

| Токен | Значение | Переопределения |
|---|---|---|
| `--jx-r` | `14px` | `[data-style="brutal"]`: `4px` |
| `--jx-r-lg` | `14px` | `[data-style="brutal"]`: `4px` |
| `--jx-r-pill` | `14px` | `[data-style="brutal"]`: `4px` |
| `--jx-r-sm` | `14px` | `[data-style="brutal"]`: `4px` |
| `--jx-r-xl` | `14px` | `[data-style="brutal"]`: `4px` |
| `--jx-r-xs` | `14px` | `[data-style="brutal"]`: `4px` |

## shadow

| Токен | Значение | Переопределения |
|---|---|---|
| `--jx-shadow` | `0 8px 24px -8px rgba(0, 0, 0, 0.6)` | `[data-style="brutal"]`: `6px 6px 0 #1a1726`; `[data-style="brutal"][data-theme="dark"]`: `6px 6px 0 #f5ff3d` |
| `--jx-shadow-lg` | `0 24px 48px -16px rgba(0, 0, 0, 0.7)` | `[data-style="brutal"]`: `10px 10px 0 #1a1726`; `[data-style="brutal"][data-theme="dark"]`: `10px 10px 0 #f5ff3d` |
| `--jx-shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.4)` | `[data-style="brutal"]`: `4px 4px 0 #1a1726`; `[data-style="brutal"][data-theme="dark"]`: `4px 4px 0 #f5ff3d` |
