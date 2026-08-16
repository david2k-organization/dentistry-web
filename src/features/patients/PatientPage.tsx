import { useCallback, useEffect, useState } from "react";
import { Download, MoreVertical, Plus, Search, Upload } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { deletePatient, getPatients } from "@/features/patients/api";
import { DeletePatientDialog } from "@/features/patients/DeletePatientDialog";
import { exportPatientsToExcel } from "@/features/patients/excel";
import { ImportPatientsDialog } from "@/features/patients/ImportPatientsDialog";
import { PatientFormDialog } from "@/features/patients/PatientFormDialog";
import { PatientTable } from "@/features/patients/PatientTable";
import type { Patient } from "@/features/patients/types";

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientPendingDelete, setPatientPendingDelete] =
    useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const loadPatients = useCallback(
    async (params: { searchKey: string; pageIndex: number; pageSize: number }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, meta } = await getPatients({
          searchKey: params.searchKey,
          page: params.pageIndex + 1,
          pageSize: params.pageSize,
        });
        setPatients(data);
        setTotal(meta.total);
      } catch {
        setError("Không thể tải danh sách bệnh nhân.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Gọi API khi từ khóa (đã debounce), trang hoặc kích thước trang thay đổi.
  useEffect(() => {
    Promise.resolve().then(() => {
      loadPatients({ searchKey: debouncedSearch, pageIndex, pageSize });
    });
  }, [loadPatients, debouncedSearch, pageIndex, pageSize]);

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setFormOpen(true);
  };

  const handleRequestEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormOpen(true);
  };

  const handleSaved = (patient: Patient) => {
    setPatients((prev) => {
      const index = prev.findIndex((p) => p.id === patient.id);
      if (index === -1) {
        setTotal((t) => t + 1);
        return [patient, ...prev];
      }
      const next = [...prev];
      next[index] = patient;
      return next;
    });
  };

  const handleImported = (imported: Patient[]) => {
    setPatients((prev) => [...imported, ...prev]);
    setTotal((t) => t + imported.length);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await getPatients({
        searchKey: debouncedSearch,
        pageSize: 1000,
      });
      if (data.length === 0) {
        toast.info("Không có bệnh nhân để xuất.");
        return;
      }
      exportPatientsToExcel(data);
      toast.success(`Đã xuất ${data.length} bệnh nhân ra Excel.`);
    } catch {
      toast.error("Không thể xuất file Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!patientPendingDelete) return;
    setDeleting(true);
    try {
      await deletePatient(patientPendingDelete.id);
      setPatients((prev) =>
        prev.filter((p) => p.id !== patientPendingDelete.id),
      );
      setTotal((t) => Math.max(0, t - 1));
      setPatientPendingDelete(null);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể xóa bệnh nhân.")
          : "Không thể xóa bệnh nhân.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <PatientTable
        patients={patients}
        loading={loading}
        onRequestEdit={handleRequestEdit}
        onRequestDelete={setPatientPendingDelete}
        pagination={{
          pageIndex,
          pageSize,
          total,
          onPaginationChange: ({ pageIndex: nextIndex, pageSize: nextSize }) => {
            setPageIndex(nextSize !== pageSize ? 0 : nextIndex);
            setPageSize(nextSize);
          },
        }}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên bệnh nhân"
                className="h-9 w-56 pl-8"
              />
            </div>
            <Button onClick={handleOpenCreate} className="gap-1.5">
              <Plus className="size-4.25" />
              Thêm bệnh nhân
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Thêm thao tác">
                  <MoreVertical className="size-4.25" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleExport} disabled={exporting}>
                  <Download />
                  Xuất Excel
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                  <Upload />
                  Nhập Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editingPatient}
        onSaved={handleSaved}
      />

      <ImportPatientsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={handleImported}
      />

      <DeletePatientDialog
        patient={patientPendingDelete}
        onOpenChange={(open) => !open && setPatientPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
