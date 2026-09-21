import type { ReactNode } from "react";
import type { SurfaceProps } from "./internal/surface.js";

export interface TabItem {
  /** Идентификатор вкладки. */
  id: string;
  /** Подпись вкладки. */
  label: string;
  /** Счётчик рядом с подписью, например количество кандидатов на этапе. */
  counter?: number;
  /** Заблокирована ли вкладка. */
  disabled?: boolean;
}

export interface TabsProps extends SurfaceProps {
  /** Список вкладок в порядке отображения. */
  items: TabItem[];
  /** Идентификатор активной вкладки. */
  activeId: string;
  /** Вызывается при переключении вкладки. */
  onChange: (id: string) => void;
  /** Содержимое активной вкладки. */
  children?: ReactNode;
  /** Визуальный стиль набора вкладок. */
  appearance?: "underline" | "pills";
}

/**
 * Набор вкладок для переключения между этапами или разделами.
 *
 * Управляемый компонент: активная вкладка приходит снаружи, что позволяет
 * синхронизировать её с URL.
 *
 * @keywords вкладки, табы, tabs, переключение, этапы, разделы
 * @example Вкладки этапов пайплайна, синхронизированные с URL
 * ```tsx
 * <Tabs
 *   items={stages.map((stage) => ({ id: stage.id, label: stage.name, counter: stage.count }))}
 *   activeId={searchParams.get("stage") ?? stages[0].id}
 *   onChange={(id) => setSearchParams({ stage: id })}
 *   appearance="underline"
 * />
 * ```
 */
export function Tabs({ items, activeId, onChange, children, appearance = "underline", padding = 0, className }: TabsProps) {
  return (
    <div className={className} data-padding={padding}>
      <div role="tablist" data-appearance={appearance}>
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={item.id === activeId}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            {item.counter === undefined ? null : <span>{item.counter}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">{children}</div>
    </div>
  );
}
