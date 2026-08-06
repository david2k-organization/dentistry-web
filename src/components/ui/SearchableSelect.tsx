import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export type SearchableSelectProps<T> = {
  options: T[];
  /** Giá trị đang chọn (khớp với `getOptionValue`); phải là duy nhất giữa các option. */
  value: string | null;
  onChange: (value: string) => void;
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Class cho nút trigger (VD: chỉnh chiều rộng). */
  className?: string;
  /**
   * Bật chế độ tìm kiếm phía server: mỗi khi từ khóa đổi (đã debounce) sẽ gọi
   * callback này thay vì lọc `options` tại chỗ. Cha tự fetch và cập nhật `options`.
   */
  onSearchChange?: (query: string) => void;
  /** Đang tải kết quả (dùng với `onSearchChange`). */
  loading?: boolean;
  /** Độ trễ debounce (ms) cho `onSearchChange`. */
  debounceMs?: number;
  /**
   * Nhãn của giá trị đang chọn — dùng khi option đó có thể không nằm trong
   * `options` hiện tại (thường gặp ở chế độ server-search sau khi lọc).
   */
  selectedLabel?: string;
};

export function SearchableSelect<T>({
  options,
  value,
  onChange,
  getOptionValue,
  getOptionLabel,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không có kết quả.",
  disabled,
  className,
  onSearchChange,
  loading,
  debounceMs = 300,
  selectedLabel,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);

  const remote = !!onSearchChange;

  const selectedOption = options.find((o) => getOptionValue(o) === value);
  const triggerLabel = selectedOption
    ? getOptionLabel(selectedOption)
    : value
      ? (selectedLabel ?? pickedLabel ?? placeholder)
      : placeholder;
  const hasSelection = !!value;

  const filtered = useMemo(() => {
    if (remote) return options;
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => normalize(getOptionLabel(o)).includes(q));
  }, [remote, options, query, getOptionLabel]);

  const didMount = useRef(false);
  useEffect(() => {
    if (!onSearchChange) return;
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const timer = setTimeout(() => onSearchChange(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, onSearchChange, debounceMs]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const handleSelect = (option: T) => {
    setPickedLabel(getOptionLabel(option));
    onChange(getOptionValue(option));
    handleOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          !hasSelection && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) gap-0 p-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {!loading && filtered.length === 0 && (
            <div className="px-2 py-4 text-center text-[12.5px] text-muted-foreground">
              {emptyMessage}
            </div>
          )}
          {filtered.map((option) => {
            const optionValue = getOptionValue(option);
            const active = optionValue === value;
            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent/60",
                )}
              >
                <span className="truncate">{getOptionLabel(option)}</span>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
