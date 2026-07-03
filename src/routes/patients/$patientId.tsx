import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatient } from "@/features/patients/api";
import { formatDate, genderLabels } from "@/features/patients/format";
import type { Patient } from "@/features/patients/types";

export const Route = createFileRoute("/patients/$patientId")({
  component: PatientDetailPage,
});

export function PatientDetailPage() {
  const { patientId } = Route.useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Quay lại" asChild>
          <Link to="/patients">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Thông tin bệnh nhân</h1>
      </div>

      {loading && <p className="text-muted-foreground">Đang tải dữ liệu...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && !patient && (
        <p className="text-muted-foreground">Không tìm thấy bệnh nhân.</p>
      )}

      {patient && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{patient.fullName}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Số điện thoại" value={patient.phone ?? "—"} />
              <DetailField label="Email" value={patient.email ?? "—"} />
              <DetailField label="Ngày sinh" value={formatDate(patient.dateOfBirth)} />
              <DetailField
                label="Giới tính"
                value={patient.gender ? genderLabels[patient.gender] : "—"}
              />
              <DetailField
                label="Ghi chú"
                value={patient.notes ?? "—"}
                className="sm:col-span-2"
              />
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
