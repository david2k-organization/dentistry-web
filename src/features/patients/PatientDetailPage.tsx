import { useEffect, useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { deletePatient, getPatient } from "@/features/patients/api";
import { DeletePatientDialog } from "@/features/patients/DeletePatientDialog";
import {
  calculateAge,
  formatCurrency,
  formatDate,
  genderLabels,
  getInitials,
} from "@/features/patients/format";
import { getPatientMock, tagBg, tagFg } from "@/features/patients/mock";
import { PatientFormDialog } from "@/features/patients/PatientFormDialog";
import type { Patient } from "@/features/patients/types";

const routeApi = getRouteApi("/_authenticated/patients/$patientId");

export function PatientDetailPage() {
  const { patientId } = routeApi.useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  const mock = patient ? getPatientMock(patient.id) : null;
  const totalPaid = mock
    ? mock.history.reduce((sum, h) => sum + h.amount, 0)
    : 0;

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
            <div className="flex shrink-0 gap-2.5">
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

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <StatCard label="Số lần khám" value={String(mock.visits)} />
            <StatCard
              label="Công nợ"
              value={mock.debt ? formatCurrency(mock.debt) : "0"}
              color={mock.debt ? "#a4553a" : undefined}
            />
            <StatCard label="Tổng chi trả" value={formatCurrency(totalPaid)} />
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[14px] border border-border bg-card">
              <div className="border-b border-[#e6efee] px-4.5 py-3.75 text-[14.5px] font-semibold text-foreground">
                Thông tin chung
              </div>
              <div className="px-4.5">
                <DetailField
                  label="Số điện thoại"
                  value={patient.phone ?? "—"}
                />
                <DetailField label="Email" value={patient.email ?? "—"} />
                <DetailField
                  label="Ngày sinh"
                  value={formatDate(patient.dateOfBirth)}
                />
                <DetailField
                  label="Giới tính"
                  value={patient.gender ? genderLabels[patient.gender] : "—"}
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
                    Lịch sử điều trị
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mock.history.length} lần
                  </div>
                </div>
                <div className="flex flex-col gap-2 px-[18px] py-3.5">
                  {mock.history.length === 0 && (
                    <div className="text-[12.5px] text-muted-foreground">
                      Chưa có lịch sử điều trị.
                    </div>
                  )}
                  {mock.history.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3.5 rounded-xl border border-[#eef4f3] px-3.5 py-3"
                    >
                      <div className="w-[70px] shrink-0 text-[12.5px] tabular-nums text-muted-foreground">
                        {h.date}
                      </div>
                      <div className="h-7 w-[3px] shrink-0 rounded-full bg-[#cfe4e2]" />
                      <div className="min-w-0 flex-1 leading-snug">
                        <div className="text-[13px] font-medium text-foreground">
                          {h.name}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {h.note}
                        </div>
                      </div>
                      <div className="shrink-0 text-[12.5px] font-medium tabular-nums text-foreground">
                        {formatCurrency(h.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[14px] border border-border bg-card">
                <div className="flex items-center gap-2.5 border-b border-[#e6efee] px-[18px] py-[15px]">
                  <div className="text-[14.5px] font-semibold text-foreground">
                    Hoá đơn của bệnh nhân
                  </div>
                  <div className="flex-1" />
                  <div className="text-xs text-muted-foreground">
                    {mock.invoices.length} hoá đơn
                  </div>
                </div>
                {mock.invoices.length === 0 && (
                  <div className="px-[18px] py-3.5 text-[12.5px] text-muted-foreground">
                    Chưa có hoá đơn nào.
                  </div>
                )}
                {mock.invoices.map((inv) => (
                  <div
                    key={inv.code}
                    className="flex items-center gap-3 border-b border-[#f0f5f4] px-[18px] py-3 text-[13px] last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="tabular-nums text-[#4a6664]">
                          {inv.code}
                        </span>
                        <span className="text-[12px] tabular-nums text-[#9fb3b1]">
                          {inv.date}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right leading-snug">
                      <div className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(inv.total)}
                      </div>
                      <span
                        className="text-[11px] font-medium"
                        style={{
                          color:
                            inv.status === "Đã thu" ? "#3f7a55" : "#9a6524",
                        }}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
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

      <DeletePatientDialog
        patient={confirmingDelete ? patient : null}
        onOpenChange={(open) => !open && setConfirmingDelete(false)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div
        className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
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
