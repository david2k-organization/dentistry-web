import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
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
import { createPatient } from "./api";
import { importRowToInput, parsePatientsExcel, type ImportRow } from "./excel";
import { genderLabels } from "./format";
import type { Patient } from "./types";

type ImportPatientsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (patients: Patient[]) => void;
};

export function ImportPatientsDialog({
  open,
  onOpenChange,
  onImported,
}: ImportPatientsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);

  const reset = () => {
    setFileName("");
    setRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setParsing(true);
    try {
      const parsed = await parsePatientsExcel(file);
      setRows(parsed);
      if (parsed.length === 0) {
        toast.error("File không có dữ liệu hoặc sai định dạng cột.");
      }
    } catch {
      toast.error("Không đọc được file. Kiểm tra định dạng .xlsx/.xls.");
      setRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    const created: Patient[] = [];
    let failed = 0;
    for (const row of validRows) {
      try {
        created.push(await createPatient(importRowToInput(row)));
      } catch {
        failed++;
      }
    }
    setImporting(false);
    if (created.length > 0) onImported(created);
    if (failed === 0) {
      toast.success(`Đã nhập ${created.length} bệnh nhân.`);
      onOpenChange(false);
      reset();
    } else {
      toast.error(`Đã nhập ${created.length} bệnh nhân, ${failed} dòng lỗi khi lưu.`);
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
            Ngày sinh (YYYY-MM-DD), Giới tính (Nam/Nữ/Khác), Ghi chú. Dùng nút
            "Xuất Excel" ở màn danh sách để lấy file mẫu đúng định dạng.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          variant="outline"
          className="w-fit gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing || importing}
        >
          <Upload className="size-4" />
          {fileName || "Chọn file .xlsx"}
        </Button>

        {parsing && (
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang đọc file...
          </div>
        )}

        {!parsing && rows.length > 0 && (
          <>
            <div className="flex gap-3 text-[13px]">
              <span className="font-medium text-[#3f7a55]">
                {validRows.length} dòng hợp lệ
              </span>
              {errorRows.length > 0 && (
                <span className="font-medium text-[#a4553a]">
                  {errorRows.length} dòng lỗi (sẽ bỏ qua)
                </span>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-[#eef4f3]">
              <div className="grid grid-cols-[50px_1.6fr_1fr_1fr_2fr] gap-2 bg-[#f7fbfa] px-3 py-2 text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
                <div>Dòng</div>
                <div>Họ tên</div>
                <div>SĐT</div>
                <div>Giới tính</div>
                <div>Lỗi</div>
              </div>
              <div className="max-h-[240px] overflow-y-auto">
                {rows.map((r) => (
                  <div
                    key={r.rowNumber}
                    className="grid grid-cols-[50px_1.6fr_1fr_1fr_2fr] gap-2 border-t border-[#f2f7f6] px-3 py-2 text-[12.5px]"
                    style={{ opacity: r.errors.length ? 0.85 : 1 }}
                  >
                    <div className="tabular-nums text-muted-foreground">
                      {r.rowNumber}
                    </div>
                    <div className="truncate font-medium text-foreground">
                      {r.fullName || "—"}
                    </div>
                    <div className="tabular-nums text-[#4a6664]">
                      {r.phone ?? "—"}
                    </div>
                    <div className="text-[#4a6664]">
                      {r.gender ? genderLabels[r.gender] : "—"}
                    </div>
                    <div className="text-[#a4553a]">{r.errors.join("; ")}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <DialogFooter className="sm:justify-start">
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || importing}
            className="gap-1.5"
          >
            {importing && <Loader2 className="size-4 animate-spin" />}
            Nhập {validRows.length > 0 ? validRows.length : ""} bệnh nhân
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
