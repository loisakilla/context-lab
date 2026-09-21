import type { ReactNode } from "react";

export interface TableColumn<Row> {
  /** Ключ колонки, должен быть уникальным в пределах таблицы. */
  key: string;
  /** Заголовок колонки. */
  title: string;
  /** Как отрисовать ячейку строки. */
  render: (row: Row) => ReactNode;
  /** Ширина колонки в CSS-единицах. */
  width?: string;
  /** Можно ли сортировать по этой колонке. */
  sortable?: boolean;
}

export interface DataTableProps<Row> {
  /** Строки таблицы. */
  rows: Row[];
  /** Описание колонок. */
  columns: TableColumn<Row>[];
  /** Показывать скелетоны вместо строк. */
  loading?: boolean;
  /** Сколько скелетон-строк рисовать во время загрузки. */
  skeletonRows?: number;
  /** Что показать, когда строк нет. */
  emptyState?: ReactNode;
  /** Текущая сортировка. */
  sort?: { key: string; direction: "asc" | "desc" };
  /** Вызывается при клике по заголовку сортируемой колонки. */
  onSortChange?: (sort: { key: string; direction: "asc" | "desc" }) => void;
  /** Вызывается при клике по строке. */
  onRowClick?: (row: Row) => void;
  /** Закрепить шапку при прокрутке. */
  stickyHeader?: boolean;
}

/**
 * Таблица данных с сортировкой, скелетонами загрузки и пустым состоянием.
 *
 * Сортировка управляемая: компонент только сообщает о клике, порядок строк
 * задаёт родитель. Так таблица одинаково работает и с серверной, и с клиентской
 * сортировкой.
 *
 * @keywords таблица, table, грид, grid, список, сортировка, данные
 * @example Таблица кандидатов с серверной сортировкой
 * ```tsx
 * <DataTable
 *   rows={candidates}
 *   columns={[
 *     { key: "name", title: "Кандидат", render: (row) => row.name, sortable: true },
 *     { key: "stage", title: "Этап", render: (row) => <Badge>{row.stage}</Badge> },
 *   ]}
 *   sort={sort}
 *   onSortChange={setSort}
 *   loading={isLoading}
 *   emptyState="Кандидаты не найдены"
 * />
 * ```
 */
export function DataTable<Row extends { id: string }>({
  rows,
  columns,
  loading = false,
  skeletonRows = 5,
  emptyState = null,
  sort,
  onSortChange,
  onRowClick,
  stickyHeader = false,
}: DataTableProps<Row>) {
  const isEmpty = !loading && rows.length === 0;

  return (
    <table data-sticky-header={stickyHeader || undefined}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
              aria-sort={sort?.key === column.key ? sort.direction : undefined}
              onClick={
                column.sortable && onSortChange
                  ? () => onSortChange({ key: column.key, direction: sort?.direction === "asc" ? "desc" : "asc" })
                  : undefined
              }
            >
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isEmpty ? (
          <tr>
            <td colSpan={columns.length}>{emptyState}</td>
          </tr>
        ) : (
          (loading ? Array.from({ length: skeletonRows }) : rows).map((row, position) => (
            <tr
              key={loading ? position : (row as Row).id}
              onClick={!loading && onRowClick ? () => onRowClick(row as Row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key}>{loading ? <span data-skeleton /> : column.render(row as Row)}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
