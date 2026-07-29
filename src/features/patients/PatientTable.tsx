import { useMemo, type ReactNode } from "react";

import { DataTable } from "@/components/ui/DataTable";
import { createPatientColumns } from "./columns";
import type { Patient } from "./types";

type PatientTableProps = {
  patients: Patient[];
  loading?: boolean;
  onRequestEdit: (patient: Patient) => void;
  onRequestDelete: (patient: Patient) => void;
  actions?: ReactNode;
};

export function PatientTable({
  patients,
  loading,
  onRequestEdit,
  onRequestDelete,
  actions,
}: PatientTableProps) {
  const columns = useMemo(
    () => createPatientColumns(onRequestEdit, onRequestDelete),
    [onRequestEdit, onRequestDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={patients}
      loading={loading}
      getRowId={(row) => row.id}
      title="Hồ sơ bệnh nhân"
      countLabel={(n) => `${n} hồ sơ`}
      actions={actions}
      emptyMessage="Chưa có bệnh nhân nào."
    />
  );
}
