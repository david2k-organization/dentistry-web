import { useRef, useState } from "react";
import { AxiosError } from "axios";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadPatientImportTemplate,
  importPatients,
  type ImportPatientsResult,
} from "./api";

type ImportPatientsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi sau khi import có ít nhất 1 dòng thành công để tải lại danh sách. */
  onImported: () => void;
};

export function ImportPatientsDialog({
  open,
  onOpenChange,
  onImported,
}: ImportPatientsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportPatientsResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadPatientImportTemplate();
    } catch {
      toast.error("Không tải được file mẫu.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const res = await importPatients(file);
      setResult(res);
      if (res.success > 0) onImported();
      if (res.failed === 0) {
        toast.success(`Đã nhập ${res.success} bệnh nhân.`);
      } else {
        toast.warning(
          `Đã nhập ${res.success} bệnh nhân, ${res.failed} dòng lỗi.`,
        );
      }
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể nhập file Excel.")
          : "Không thể nhập file Excel.";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <div className="grid size-[42px] place-items-center rounded-xl bg-accent text-primary">
          <FileSpreadsheet className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Nhập bệnh nhân từ Excel</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            File .xlsx với các cột: Họ tên (bắt buộc), Số điện thoại, Email,
            Ngày sinh (YYYY-MM-DD), Giới tính (Nam/Nữ/Khác), Ghi chú. Tải file
            mẫu bên dưới để nhập đúng định dạng. Mỗi dòng được kiểm tra độc lập —
            dòng lỗi sẽ bị bỏ qua.
          </DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          className="w-fit gap-1.5"
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
        >
          {downloadingTemplate ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Tải file mẫu
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) {
              setFile(selected);
              setResult(null);
            }
          }}
        />
        <Button
          variant="outline"
          className="w-fit gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <Upload className="size-4" />
          {file?.name || "Chọn file .xlsx"}
        </Button>

        {result && (
          <>
            <div className="flex flex-wrap gap-3 text-[13px]">
              <span className="text-muted-foreground">
                Tổng {result.total} dòng
              </span>
              <span className="font-medium text-[#3f7a55]">
                {result.success} thành công
              </span>
              {result.failed > 0 && (
                <span className="font-medium text-[#a4553a]">
                  {result.failed} dòng lỗi
                </span>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[#eef4f3]">
                <div className="grid grid-cols-[50px_1fr] gap-2 bg-[#f7fbfa] px-3 py-2 text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
                  <div>Dòng</div>
                  <div>Lỗi</div>
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {result.errors.map((e) => (
                    <div
                      key={e.row}
                      className="grid grid-cols-[50px_1fr] gap-2 border-t border-[#f2f7f6] px-3 py-2 text-[12.5px]"
                    >
                      <div className="tabular-nums text-muted-foreground">
                        {e.row}
                      </div>
                      <div className="text-[#a4553a]">{e.errors.join("; ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter className="sm:justify-start">
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="gap-1.5"
          >
            {importing && <Loader2 className="size-4 animate-spin" />}
            Nhập bệnh nhân
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
