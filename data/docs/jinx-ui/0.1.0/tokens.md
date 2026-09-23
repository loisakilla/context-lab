# Токены дизайн-системы

Используйте `var(--токен)` вместо значений: цвета меняются по `data-theme`, радиусы по `data-style`.

## color

| Токен | Значение | Переопределения |
|---|---|---|
| `--jx-accent` | `#c9a3ff` | `[data-theme="light"]`: `#6f3fcc` |
| `--jx-accent-ink` | `#0c0a14` | `[data-theme="light"]`: `#ffffff` |
| `--jx-accent-soft` | `rgba(201, 163, 255, 0.14)` | `[data-theme="light"]`: `rgba(111, 63, 204, 0.12)` |
| `--jx-bg` | `#0c0a14` | `[data-theme="light"]`: `#f5f2e9` |
| `--jx-bg-2` | `#0f0d18` | `[data-theme="light"]`: `#ece8dc` |
| `--jx-border` | `#221c30` | `[data-theme="light"]`: `#ddd6c4`; `[data-style="brutal"]`: `var(--jx-edge)` |
| `--jx-border-2` | `#3a3150` | `[data-theme="light"]`: `#b8ae96`; `[data-style="brutal"]`: `var(--jx-edge)` |
| `--jx-danger` | `#ff5470` | `[data-theme="light"]`: `#b01834` |
| `--jx-info` | `#79c8ff` | `[data-theme="light"]`: `#17518f` |
| `--jx-rule` | `#1c1828` | `[data-theme="light"]`: `#ddd6c4`; `[data-style="brutal"]`: `var(--jx-edge)` |
| `--jx-success` | `#6bd97a` | `[data-theme="light"]`: `#176034` |
| `--jx-surface` | `#15121f` | `[data-theme="light"]`: `#ffffff` |
| `--jx-surface-2` | `#1c1828` | `[data-theme="light"]`: `#f5f1e6` |
| `--jx-surface-3` | `#2a2438` | `[data-theme="light"]`: `#e6e0d0` |
| `--jx-text` | `#f0ecf5` | `[data-theme="light"]`: `#1a1726` |
| `--jx-text-2` | `#a59cb8` | `[data-theme="light"]`: `#4a4258` |
| `--jx-text-3` | `#8d84a8` | `[data-theme="light"]`: `#6b6379` |
| `--jx-text-4` | `#463e5a` | `[data-theme="light"]`: `#b4abc0` |
| `--jx-warning` | `#ffb547` | `[data-theme="light"]`: `#7d4f00` |

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

## other

| Токен | Значение | Переопределения |
|---|---|---|
| `--jx-edge` | `color-mix(in oklab, var(--jx-text) 82%, var(--jx-bg))` |  |

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
| `--jx-shadow` | `0 8px 24px -8px rgba(0, 0, 0, 0.6)` | `[data-style="brutal"]`: `6px 6px 0 var(--jx-edge)` |
| `--jx-shadow-lg` | `0 24px 48px -16px rgba(0, 0, 0, 0.7)` | `[data-style="brutal"]`: `10px 10px 0 var(--jx-edge)` |
| `--jx-shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.4)` | `[data-style="brutal"]`: `4px 4px 0 var(--jx-edge)` |
