import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, genderLabels } from "./format";
import type { Patient } from "./types";

const columnHelper = createColumnHelper<Patient>();

export function createPatientColumns(
  onRequestEdit: (patient: Patient) => void,
  onRequestDelete: (patient: Patient) => void
) {
  return [
    columnHelper.accessor("fullName", {
      header: "Họ và tên",
      cell: (info) => (
        <span className="font-medium text-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("phone", {
      header: "Số điện thoại",
      cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.accessor("dateOfBirth", {
      header: "Ngày sinh",
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor("gender", {
      header: "Giới tính",
      cell: (info) => {
        const gender = info.getValue();
        return gender ? genderLabels[gender] : "—";
      },
    }),
    columnHelper.accessor("notes", {
      header: "Ghi chú",
      cell: (info) => {
        const notes = info.getValue();
        return (
          <span
            className="block max-w-[240px] truncate text-muted-foreground"
            title={notes ?? undefined}
          >
            {notes ?? "—"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const patient = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Xem chi tiết" asChild>
              <Link to="/patients/$patientId" params={{ patientId: patient.id }}>
                <Eye />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sửa bệnh nhân"
              onClick={() => onRequestEdit(patient)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Xóa bệnh nhân"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRequestDelete(patient)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    }),
  ];
}
