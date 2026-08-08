import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { iconActionButtonClass } from "@/lib/utils";
import {
  calculateAge,
  formatCurrency,
  genderLabels,
  getInitials,
} from "./format";
import { getPatientMock } from "./mock";
import type { Patient } from "./types";

const columnHelper = createColumnHelper<Patient>();

export function createPatientColumns(
  onRequestEdit: (patient: Patient) => void,
  onRequestDelete: (patient: Patient) => void,
) {
  return [
    columnHelper.accessor("fullName", {
      header: "Bệnh nhân",
      cell: (info) => {
        const patient = info.row.original;
        const mock = getPatientMock(patient.id);
        return (
          <Link
            to="/patients/$patientId"
            params={{ patientId: patient.id }}
            className="flex min-w-0 items-center gap-2.5"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
              {getInitials(patient.fullName)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium text-foreground">
                {patient.fullName}
              </div>
              <div className="text-[11.5px] text-muted-foreground">
                {mock.code} ·{" "}
                {patient.gender
                  ? genderLabels[patient.gender]
                  : "Chưa rõ giới tính"}
              </div>
            </div>
          </Link>
        );
      },
    }),
    columnHelper.accessor("phone", {
      header: "Số điện thoại",
      cell: (info) => (
        <span className="tabular-nums text-[#4a6664]">
          {info.getValue() ?? "—"}
        </span>
      ),
    }),
    columnHelper.accessor("dateOfBirth", {
      header: "Tuổi",
      cell: (info) => {
        const age = calculateAge(info.getValue());
        return (
          <span className="tabular-nums text-[#4a6664]">{age ?? "—"}</span>
        );
      },
    }),
    columnHelper.display({
      id: "lastVisit",
      header: "Lần khám gần nhất",
      cell: (info) => {
        const mock = getPatientMock(info.row.original.id);
        const latest = mock.history[0];
        return (
          <span className="min-w-0 truncate text-[#4a6664]">
            {latest ? `${latest.date} — ${latest.name}` : "Chưa khám lần nào"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "debt",
      header: "Công nợ",
      cell: (info) => {
        const mock = getPatientMock(info.row.original.id);
        return (
          <span
            className="tabular-nums font-medium"
            style={{ color: mock.debt ? "#a4553a" : "#a3b3b2" }}
          >
            {mock.debt ? formatCurrency(mock.debt) : "—"}
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
          <div className="flex items-center justify-end gap-1.5">
            <Link
              to="/patients/$patientId"
              params={{ patientId: patient.id }}
              title="Xem chi tiết"
              className={iconActionButtonClass()}
            >
              <Eye className="size-[17px]" />
            </Link>
            <button
              type="button"
              title="Sửa hồ sơ"
              onClick={() => onRequestEdit(patient)}
              className={iconActionButtonClass()}
            >
              <Pencil className="size-[17px]" />
            </button>
            <button
              type="button"
              title="Xoá hồ sơ"
              onClick={() => onRequestDelete(patient)}
              className={iconActionButtonClass("danger")}
            >
              <Trash2 className="size-[17px]" />
            </button>
          </div>
        );
      },
    }),
  ];
}
