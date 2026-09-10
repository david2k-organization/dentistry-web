import { FilePlus2, Receipt } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import type { TreatmentRecord } from "@/features/treatment-records/types";

const vnd = new Intl.NumberFormat("vi-VN");
const dong = (amount: number) => `${vnd.format(amount)}đ`;

type TreatmentRecordsCardProps = {
  records: TreatmentRecord[];
  total: number;
  /** Đang tải trang đầu. */
  loading: boolean;
  /** Đang tải thêm trang tiếp theo. */
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  serviceName: (r: TreatmentRecord) => string;
  price: (r: TreatmentRecord) => number;
  doctorName: (r: TreatmentRecord) => string;
  supplyCount: (r: TreatmentRecord) => number;
  onAddRecord: () => void;
  onViewDetail: (r: TreatmentRecord) => void;
  onCreateInvoice: (r: TreatmentRecord) => void;
};

/** Thẻ "Hồ sơ điều trị" với danh sách ca (infinite load) và các thao tác trên từng ca. */
export function TreatmentRecordsCard({
  records,
  total,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  serviceName,
  price,
  doctorName,
  supplyCount,
  onAddRecord,
  onViewDetail,
  onCreateInvoice,
}: TreatmentRecordsCardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-[#e6efee] px-[18px] py-[15px]">
        <div className="text-[14.5px] font-semibold text-foreground">
          Hồ sơ điều trị
        </div>
        <div className="text-xs text-muted-foreground">{total} ca</div>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onAddRecord}
        >
          <FilePlus2 className="size-4" />
          Ghi hồ sơ
        </Button>
      </div>
      <InfiniteScroll
        className="flex min-h-0 flex-1 flex-col gap-2.5 px-[18px] py-3.5"
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        loading={loadingMore}
        endMessage={
          records.length > 0 ? (
            <div className="py-1 text-center text-[11.5px] text-muted-foreground">
              Đã hiển thị tất cả {total} ca
            </div>
          ) : null
        }
      >
        {loading && records.length === 0 && (
          <div className="text-[12.5px] text-muted-foreground">
            Đang tải hồ sơ điều trị…
          </div>
        )}
        {!loading && records.length === 0 && (
          <div className="text-[12.5px] text-muted-foreground">
            Chưa có ca điều trị nào.
          </div>
        )}
        {records.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#eef4f3] p-3.5">
            <div className="flex gap-3.5">
              <div className="w-[68px] shrink-0 pt-0.5 text-[12.5px] tabular-nums text-muted-foreground">
                {format(new Date(r.createdAt), "dd/MM/yyyy")}
              </div>
              <div className="w-[3px] shrink-0 self-stretch rounded-full bg-[#3f7a55]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2.5">
                  <div className="min-w-0 flex-1 text-[13.5px] font-medium text-foreground">
                    {serviceName(r)}
                  </div>
                  <div className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
                    {dong(price(r))}
                  </div>
                </div>
                <div className="mt-1.5 text-[12px] text-muted-foreground">
                  {doctorName(r)} · {supplyCount(r)} vật tư
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onViewDetail(r)}
                    className="cursor-pointer rounded-lg border border-[#cfe0df] bg-card px-3 py-1 text-[12px] font-medium text-primary hover:bg-accent"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateInvoice(r)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#cfe0df] bg-card px-3 py-1 text-[12px] font-medium text-primary hover:bg-accent"
                  >
                    <Receipt className="size-3.5" />
                    Tạo hóa đơn
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}
