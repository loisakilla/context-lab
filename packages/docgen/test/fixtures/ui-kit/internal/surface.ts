export interface SurfaceProps {
  /** CSS-класс на корневом элементе. Для точечных правок вёрстки. */
  className?: string;
  /** Отступ внутри поверхности, в шагах сетки. */
  padding?: 0 | 1 | 2 | 3 | 4;
  /** Атрибут для автотестов. */
  "data-testid"?: string;
}
