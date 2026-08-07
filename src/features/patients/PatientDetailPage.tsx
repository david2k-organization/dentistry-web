import { useEffect, useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  FilePlus2,
  LayoutGrid,
  Pencil,
  Trash2,
} from "lucide-react";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BookAppointmentDialog } from "@/features/appointments/BookAppointmentDialog";
import { getSupplies } from "@/features/inventory/api";
import type { Supply } from "@/features/inventory/types";
import { deletePatient, getPatient } from "@/features/patients/api";
import { DeletePatientDialog } from "@/features/patients/DeletePatientDialog";
import {
  calculateAge,
  genderLabels,
  getInitials,
} from "@/features/patients/format";
import { getPatientMock, tagBg, tagFg } from "@/features/patients/mock";
import { PatientFormDialog } from "@/features/patients/PatientFormDialog";
import { TreatmentDetailDialog } from "@/features/patients/TreatmentDetailDialog";
import { TreatmentRecordDialog } from "@/features/patients/TreatmentRecordDialog";
import type { Patient } from "@/features/patients/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { getTreatmentRecords } from "@/features/treatment-records/api";
import type { TreatmentRecord } from "@/features/treatment-records/types";
import { getUsers } from "@/features/users/api";
import type { User } from "@/features/users/types";

const routeApi = getRouteApi("/_authenticated/patients/$patientId");

const vnd = new Intl.NumberFormat("vi-VN");
const dong = (amount: number) => `${vnd.format(amount)}đ`;

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
  const [detailRecord, setDetailRecord] = useState<TreatmentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Hồ sơ điều trị thật + map để tra tên dịch vụ/bác sĩ/vật tư.
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<string, Service>>({});
  const [doctorMap, setDoctorMap] = useState<Record<string, User>>({});
  const [supplyMap, setSupplyMap] = useState<Record<string, Supply>>({});
  // Tăng để nạp lại danh sách hồ sơ sau khi ghi ca mới.
  const [reload, setReload] = useState(0);

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

  // Nạp hồ sơ điều trị của bệnh nhân + dữ liệu tra cứu tên.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getTreatmentRecords({ patientId, pageSize: 100 }),
      getServices({ pageSize: 100 }),
      getUsers({ pageSize: 100 }),
      getSupplies({ pageSize: 100 }),
    ])
      .then(([recordPage, servicePage, userPage, supplyPage]) => {
        if (cancelled) return;
        // Backend đã lọc theo patientId và sắp xếp mới nhất trước.
        setRecords(recordPage.data);
        setServiceMap(toMap(servicePage.data));
        setDoctorMap(toMap(userPage.data));
        setSupplyMap(toMap(supplyPage.data));
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, reload]);

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

  const notImplemented = () => toast.info("Tính năng đang được phát triển.");

  const serviceOf = (r: TreatmentRecord) => serviceMap[r.serviceId];
  const priceOf = (r: TreatmentRecord) => Number(serviceOf(r)?.price ?? 0);
  const serviceName = (r: TreatmentRecord) => serviceOf(r)?.name ?? "Dịch vụ điều trị";
  const doctorName = (r: TreatmentRecord) => doctorMap[r.doctorId]?.fullName ?? "—";
  const supplyCount = (r: TreatmentRecord) =>
    r.treatmentSupplies?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;

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
          <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-card p-[22px]">
            <div className="grid size-[58px] shrink-0 place-items-center rounded-full bg-accent text-lg font-semibold text-primary">
              {getInitials(patient.fullName)}
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
              <Button className="gap-1.5" onClick={notImplemented}>
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
            <div className="overflow-hidden rounded-[14px] border border-border bg-card">
              <div className="border-b border-[#e6efee] px-4.5 py-3.75 text-[14.5px] font-semibold text-foreground">
                Thông tin hành chính
              </div>
              <div className="px-4.5">
                <DetailField label="Mã hồ sơ" value={mock.code} />
                <DetailField label="Bác sĩ phụ trách" value={mock.doctor} />
                <DetailField label="Điện thoại" value={patient.phone ?? "—"} />
                <DetailField
                  label="Lần khám gần nhất"
                  value={
                    lastVisit
                      ? `${format(new Date(lastVisit.createdAt), "dd/MM/yyyy")} — ${serviceName(lastVisit)}`
                      : "—"
                  }
                />
                <DetailField label="Địa chỉ" value={mock.address} />
                <DetailField
                  label="Tiền sử dị ứng"
                  value={mock.allergy}
                  valueColor={
                    mock.allergy === "Không ghi nhận" ? undefined : "#a4553a"
                  }
                />
                <DetailField
                  label="Ghi chú lâm sàng"
                  value={patient.notes ?? "—"}
                  last
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-[14px] border border-border bg-card">
                <div className="flex items-center gap-2.5 border-b border-[#e6efee] px-[18px] py-[15px]">
                  <div className="text-[14.5px] font-semibold text-foreground">
                    Hồ sơ điều trị
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {records.length} ca
                  </div>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setRecordOpen(true)}
                  >
                    <FilePlus2 className="size-4" />
                    Ghi hồ sơ
                  </Button>
                </div>
                <div className="flex flex-col gap-2.5 px-[18px] py-3.5">
                  {records.length === 0 && (
                    <div className="text-[12.5px] text-muted-foreground">
                      Chưa có ca điều trị nào.
                    </div>
                  )}
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-[#eef4f3] p-3.5"
                    >
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
                              {dong(priceOf(r))}
                            </div>
                          </div>
                          <div className="mt-1.5 text-[12px] text-muted-foreground">
                            {doctorName(r)} · {supplyCount(r)} vật tư
                          </div>
                          <button
                            type="button"
                            onClick={() => setDetailRecord(r)}
                            className="mt-2.5 cursor-pointer rounded-lg border border-[#cfe0df] bg-card px-3 py-1 text-[12px] font-medium text-primary hover:bg-accent"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
    </div>
  );
}

function DetailField({
  label,
  value,
  valueColor,
  last,
}: {
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex gap-3.5 py-3 ${last ? "" : "border-b border-[#f2f7f6]"}`}
    >
      <div className="w-[136px] shrink-0 text-[12.5px] text-muted-foreground">
        {label}
      </div>
      <div
        className="flex-1 text-[13px] font-medium whitespace-pre-wrap text-foreground"
        style={{ color: valueColor }}
      >
        {value}
      </div>
    </div>
  );
}
