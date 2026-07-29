import { useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];

type DataTableProps<TData> = {
  // TanStack column defs mix a different value type per column, so a single
  // TValue generic can't represent the array — `any` matches TanStack's own typing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Hiển thị trạng thái đang tải trong thân bảng. */
  loading?: boolean;
  /** Thông báo khi không có dòng nào. */
  emptyMessage?: string;
  /** Định danh ổn định cho từng dòng (mặc định dùng index). */
  getRowId?: (row: TData, index: number) => string;
  /** Bấm vào dòng — khi có, con trỏ đổi thành pointer. */
  onRowClick?: (row: TData) => void;
  /** Tiêu đề thẻ, ví dụ "Hồ sơ bệnh nhân". */
  title?: string;
  /** Nhãn số lượng bên cạnh tiêu đề, ví dụ (n) => `${n} hồ sơ`. */
  countLabel?: (total: number) => string;
  /** Số dòng mỗi trang ban đầu (mặc định 20). */
  pageSize?: number;
  /** Các lựa chọn số dòng/trang (mặc định 20/50/100). */
  pageSizeOptions?: number[];
};

export function DataTable<TData>({
  columns,
  data,
  loading,
  emptyMessage = "Không có dữ liệu.",
  getRowId,
  onRowClick,
  title,
  countLabel,
  pageSize = 20,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
    initialState: { pagination: { pageSize } },
  });

  const total = data.length;
  const { pageIndex, pageSize: currentSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const rows = table.getRowModel().rows;
  const from = total === 0 ? 0 : pageIndex * currentSize + 1;
  const to = Math.min((pageIndex + 1) * currentSize, total);

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      {title && (
        <div className="flex items-center gap-3 border-b border-[#e6efee] px-[18px] py-[15px]">
          <div className="text-[14.5px] font-semibold text-foreground">{title}</div>
          {countLabel && (
            <div className="text-xs text-muted-foreground">{countLabel(total)}</div>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-[#e6efee] bg-[#f7fbfa] hover:bg-[#f7fbfa]"
            >
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className="h-auto px-[18px] py-2.5 text-[11.5px] font-medium tracking-[0.04em] text-muted-foreground uppercase"
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="-mx-1 inline-flex select-none items-center gap-1 rounded px-1 text-inherit uppercase transition-colors hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="size-3.5 text-primary" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3.5 text-primary" />
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Đang tải dữ liệu...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  "border-b border-[#f0f5f4] text-[13px] hover:bg-[#f7fbfa]",
                  onRowClick && "cursor-pointer"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-[18px] py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e6efee] px-[18px] py-2.5">
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span>Số dòng</span>
            <Select
              value={String(currentSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="h-7 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-[12.5px] tabular-nums text-muted-foreground">
            Hiển thị {from}–{to} trong {total}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Trang trước"
            >
              <ChevronLeft />
            </Button>
            <span className="text-[12.5px] font-medium tabular-nums text-foreground">
              Trang {pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Trang sau"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
