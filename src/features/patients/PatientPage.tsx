import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { deletePatient, getPatients } from "@/features/patients/api";
import { DeletePatientDialog } from "@/features/patients/DeletePatientDialog";
import { PatientFormDialog } from "@/features/patients/PatientFormDialog";
import { PatientTable } from "@/features/patients/PatientTable";
import type { Patient } from "@/features/patients/types";

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientPendingDelete, setPatientPendingDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch {
      setError("Không thể tải danh sách bệnh nhân.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadPatients();
    });
  }, [loadPatients]);

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
      if (index === -1) return [patient, ...prev];
      const next = [...prev];
      next[index] = patient;
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!patientPendingDelete) return;
    setDeleting(true);
    try {
      await deletePatient(patientPendingDelete.id);
      setPatients((prev) => prev.filter((p) => p.id !== patientPendingDelete.id));
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
        actions={
          <Button onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="size-[17px]" />
            Thêm bệnh nhân
          </Button>
        }
      />

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editingPatient}
        onSaved={handleSaved}
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
