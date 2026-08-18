import type { ReactNode, UIEvent } from "react";

import { cn } from "@/lib/utils";

type InfiniteScrollProps = {
  children: ReactNode;
  /** Gọi khi cuộn tới gần cuối và còn dữ liệu để tải. */
  onLoadMore: () => void;
  /** Còn trang tiếp theo để tải hay không. */
  hasMore: boolean;
  /** Đang tải thêm — chặn gọi trùng và hiển thị chỉ báo. */
  loading?: boolean;
  /** Khoảng cách (px) tới đáy để kích hoạt tải thêm. */
  threshold?: number;
  /** Class cho khung cuộn (max-height, padding, layout...). */
  className?: string;
  /** Chỉ báo "đang tải thêm" tuỳ biến (mặc định là dòng chữ mờ). */
  loadingIndicator?: ReactNode;
  /** Nội dung hiển thị khi đã hết dữ liệu. */
  endMessage?: ReactNode;
};

/**
 * Khung cuộn có infinite load: tự gọi `onLoadMore` khi cuộn gần đáy (còn dữ liệu
 * và không đang tải). Không tự quản lý dữ liệu — caller giữ danh sách, `hasMore`
 * và `loading`.
 */
export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  loading = false,
  threshold = 80,
  className,
  loadingIndicator,
  endMessage,
}: InfiniteScrollProps) {
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    if (nearBottom && hasMore && !loading) {
      onLoadMore();
    }
  };

  return (
    <div className={cn("overflow-y-auto", className)} onScroll={handleScroll}>
      {children}
      {loading &&
        (loadingIndicator ?? (
          <div className="py-1 text-center text-[12px] text-muted-foreground">
            Đang tải thêm…
          </div>
        ))}
      {!loading && !hasMore && endMessage}
    </div>
  );
}
