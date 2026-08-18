import { useCallback, useEffect, useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  LayoutGrid,
  Pencil,
  Trash2,
} from "lucide-react";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createOrder } from "@/features/invoices/api";
import { BookAppointmentDialog } from "@/features/appointments/BookAppointmentDialog";
import { getSupplies } from "@/features/inventory/api";
import type { Supply } from "@/features/inventory/types";
import { deletePatient, getPatient } from "@/features/patients/api";
import { CreateInvoiceFromRecordDialog } from "@/features/patients/CreateInvoiceFromRecordDialog";
import { DeletePatientDialog } from "@/features/patients/DeletePatientDialog";
import {
  calculateAge,
  genderLabels,
  getInitials,
} from "@/features/patients/format";
import { getPatientMock, tagBg, tagFg } from "@/features/patients/mock";
import { PatientAdminInfo } from "@/features/patients/PatientAdminInfo";
import { PatientFormDialog } from "@/features/patients/PatientFormDialog";
import { TreatmentDetailDialog } from "@/features/patients/TreatmentDetailDialog";
import { TreatmentRecordDialog } from "@/features/patients/TreatmentRecordDialog";
import { TreatmentRecordsCard } from "@/features/patients/TreatmentRecordsCard";
import type { Patient } from "@/features/patients/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { getTreatmentRecords } from "@/features/treatment-records/api";
import type { TreatmentRecord } from "@/features/treatment-records/types";
import { getUsers } from "@/features/users/api";
import type { User } from "@/features/users/types";

const routeApi = getRouteApi("/_authenticated/patients/$patientId");

const RECORDS_PAGE_SIZE = 10;

function toMap<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((it) => [it.id, it]));
}

export function PatientDetailPage() {
  const { patientId } = routeApi.useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<TreatmentRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [invoicingRecord, setInvoicingRecord] =
    useState<TreatmentRecord | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingMoreRecords, setLoadingMoreRecords] = useState(false);
  const [serviceMap, setServiceMap] = useState<Record<string, Service>>({});
  const [doctorMap, setDoctorMap] = useState<Record<string, User>>({});
  const [supplyMap, setSupplyMap] = useState<Record<string, Supply>>({});

  const [reload, setReload] = useState(0);

  const hasMoreRecords = records.length < recordsTotal;

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPatient(patientId);
        if (!cancelled) setPatient(data);
      } catch {
        if (!cancelled) setError("Không thể tải thông tin bệnh nhân.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoadingRecords(true);
      try {
        const [recordPage, servicePage, userPage, supplyPage] =
          await Promise.all([
            getTreatmentRecords({
              patientId,
              page: 1,
              pageSize: RECORDS_PAGE_SIZE,
            }),
            getServices({ pageSize: 100 }),
            getUsers({ pageSize: 100 }),
            getSupplies({ pageSize: 100 }),
          ]);
        if (cancelled) return;
        setRecords(recordPage.data);
        setRecordsTotal(recordPage.meta.total);
        setRecordsPage(1);
        setServiceMap(toMap(servicePage.data));
        setDoctorMap(toMap(userPage.data));
        setSupplyMap(toMap(supplyPage.data));
      } catch {
        if (!cancelled) {
          setRecords([]);
          setRecordsTotal(0);
        }
      } finally {
        if (!cancelled) setLoadingRecords(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [patientId, reload]);

  // Nạp thêm một trang khi cuộn tới cuối danh sách (infinite load).
  const loadMoreRecords = useCallback(async () => {
    setLoadingMoreRecords(true);
    try {
      const nextPage = recordsPage + 1;
      const { data, meta } = await getTreatmentRecords({
        patientId,
        page: nextPage,
        pageSize: RECORDS_PAGE_SIZE,
      });
      setRecords((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...data.filter((r) => !seen.has(r.id))];
      });
      setRecordsTotal(meta.total);
      setRecordsPage(nextPage);
    } catch {
      toast.error("Không tải thêm được hồ sơ điều trị.");
    } finally {
      setLoadingMoreRecords(false);
    }
  }, [patientId, recordsPage]);

  const handleConfirmDelete = async () => {
    if (!patient) return;
    setDeleting(true);
    try {
      await deletePatient(patient.id);
      navigate({ to: "/patients" });
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể xóa bệnh nhân.")
          : "Không thể xóa bệnh nhân.";
      setError(message);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const serviceOf = (r: TreatmentRecord) => serviceMap[r.serviceId];
  const priceOf = (r: TreatmentRecord) => Number(serviceOf(r)?.price ?? 0);
  const serviceName = (r: TreatmentRecord) =>
    serviceOf(r)?.name ?? "Dịch vụ điều trị";
  const doctorName = (r: TreatmentRecord) =>
    doctorMap[r.doctorId]?.fullName ?? "—";
  const supplyCount = (r: TreatmentRecord) =>
    r.treatmentSupplies?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;

  // Tạo hóa đơn từ 1 ca điều trị: một dòng dịch vụ, số lượng 1, giá theo dịch vụ.
  const handleCreateInvoice = async () => {
    if (!invoicingRecord) return;
    const price = priceOf(invoicingRecord);
    setCreatingInvoice(true);
    try {
      const order = await createOrder({
        patientId: invoicingRecord.patientId,
        doctorId: invoicingRecord.doctorId,
        totalAmount: price,
        services: [
          {
            serviceId: invoicingRecord.serviceId,
            quantity: 1,
            unitPrice: price,
            amount: price,
          },
        ],
      });
      toast.success(`Đã tạo hóa đơn ${order.code}`);
      setInvoicingRecord(null);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể tạo hóa đơn.")
          : "Không thể tạo hóa đơn.";
      toast.error(message);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const mock = patient ? getPatientMock(patient.id) : null;
  const lastVisit = records[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-1.5 text-muted-foreground"
        asChild
      >
        <Link to="/patients">
          <ArrowLeft className="size-4" />
          Danh sách bệnh nhân
        </Link>
      </Button>

      {loading && <p className="text-muted-foreground">Đang tải dữ liệu...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && !patient && (
        <p className="text-muted-foreground">Không tìm thấy bệnh nhân.</p>
      )}

      {patient && mock && (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-card p-5.5">
            <div className="size-14.5 shrink-0 overflow-hidden rounded-full bg-accent">
              {(patient.avatar ?? mock.avatar) ? (
                <img
                  src={(patient.avatar ?? mock.avatar) as string}
                  alt={patient.fullName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-lg font-semibold text-primary">
                  {getInitials(patient.fullName)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="text-[22px] font-semibold tracking-tight text-foreground">
                  {patient.fullName}
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                  style={{
                    background: tagBg(mock.tag),
                    color: tagFg(mock.tag),
                  }}
                >
                  {mock.tag}
                </span>
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {mock.code} ·{" "}
                {[
                  patient.gender ? genderLabels[patient.gender] : null,
                  calculateAge(patient.dateOfBirth) != null
                    ? `${calculateAge(patient.dateOfBirth)} tuổi`
                    : null,
                  patient.phone,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Button
                className="gap-1.5"
                onClick={() =>
                  navigate({
                    to: "/tooth-chart",
                    search: {
                      patientId: patient.id,
                      patientName: patient.fullName,
                    },
                  })
                }
              >
                <LayoutGrid className="size-4" />
                Sơ đồ răng
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setApptOpen(true)}
              >
                <CalendarPlus className="size-4" />
                Đặt hẹn
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" />
                Sửa
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Xoá hồ sơ"
                className="border-border text-[#4a6664] hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <PatientAdminInfo
              code={mock.code}
              doctor={mock.doctor}
              phone={patient.phone ?? "—"}
              lastVisit={
                lastVisit
                  ? `${format(new Date(lastVisit.createdAt), "dd/MM/yyyy")} — ${serviceName(lastVisit)}`
                  : "—"
              }
              address={mock.address}
              allergy={mock.allergy}
              notes={patient.notes ?? "—"}
            />

            <div className="flex flex-col gap-4">
              <TreatmentRecordsCard
                records={records}
                total={recordsTotal}
                loading={loadingRecords}
                loadingMore={loadingMoreRecords}
                hasMore={hasMoreRecords}
                onLoadMore={loadMoreRecords}
                serviceName={serviceName}
                price={priceOf}
                doctorName={doctorName}
                supplyCount={supplyCount}
                onAddRecord={() => setRecordOpen(true)}
                onViewDetail={setDetailRecord}
                onCreateInvoice={setInvoicingRecord}
              />
            </div>
          </div>
        </>
      )}

      <PatientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        patient={patient}
        onSaved={(updated) => setPatient(updated)}
      />

      {patient && mock && (
        <TreatmentRecordDialog
          open={recordOpen}
          onOpenChange={setRecordOpen}
          patient={patient}
          patientCode={mock.code}
          onSaved={() => setReload((n) => n + 1)}
        />
      )}

      {patient && mock && (
        <TreatmentDetailDialog
          record={detailRecord}
          onOpenChange={(open) => !open && setDetailRecord(null)}
          patientName={patient.fullName}
          patientCode={mock.code}
          serviceName={detailRecord ? serviceName(detailRecord) : ""}
          doctorName={detailRecord ? doctorName(detailRecord) : ""}
          price={detailRecord ? priceOf(detailRecord) : 0}
          supplyMap={supplyMap}
        />
      )}

      {patient && mock && (
        <BookAppointmentDialog
          open={apptOpen}
          onOpenChange={setApptOpen}
          patient={patient}
          patientCode={mock.code}
        />
      )}

      <DeletePatientDialog
        patient={confirmingDelete ? patient : null}
        onOpenChange={(open) => !open && setConfirmingDelete(false)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />

      <CreateInvoiceFromRecordDialog
        open={!!invoicingRecord}
        onOpenChange={(open) => !open && setInvoicingRecord(null)}
        serviceName={invoicingRecord ? serviceName(invoicingRecord) : ""}
        doctorName={invoicingRecord ? doctorName(invoicingRecord) : ""}
        patientName={patient?.fullName ?? ""}
        amount={invoicingRecord ? priceOf(invoicingRecord) : 0}
        creating={creatingInvoice}
        onConfirm={handleCreateInvoice}
      />
    </div>
  );
}
