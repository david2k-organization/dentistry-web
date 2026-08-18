import { useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";

import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import type { ToothState } from "@/features/services/types";
import {
  createOdontogram,
  getOdontogram,
  getToothHistory,
  LOWER_LEFT,
  LOWER_RIGHT,
  UPPER_LEFT,
  UPPER_RIGHT,
  updateTooth,
} from "./api";
import type { PatientTooth, ToothStateHistory } from "./types";

const TOOTH_STATE: Record<
  ToothState,
  { label: string; bg: string; border: string; fg: string }
> = {
  NORMAL: { label: "Bình thường", bg: "#ffffff", border: "#cfe0df", fg: "#4a6664" },
  DECAY: { label: "Sâu răng", bg: "#fdf3e8", border: "#e9c893", fg: "#9a6524" },
  FILLED: { label: "Đã trám", bg: "#e7f1f0", border: "#8fc4be", fg: "#0f7a73" },
  CROWN: { label: "Đã bọc mão sứ", bg: "#fdf6e3", border: "#e6d38a", fg: "#8a6d1f" },
  ROOT_CANAL: { label: "Đã điều trị tủy", bg: "#ece9f5", border: "#c3bce0", fg: "#5468a8" },
  EXTRACTED: { label: "Đã nhổ", bg: "#fbeeea", border: "#e6cdbf", fg: "#a4553a" },
  IMPLANT: { label: "Implant", bg: "#e8f1fb", border: "#b8d4f0", fg: "#2f6a9e" },
  MISSING: { label: "Thiếu răng", bg: "#f1f5f5", border: "#dde8e7", fg: "#7e9997" },
  VENEER: { label: "Dán sứ", bg: "#fbeaf0", border: "#eec3d6", fg: "#a4467a" },
};

const STATE_ORDER: ToothState[] = [
  "NORMAL",
  "DECAY",
  "FILLED",
  "CROWN",
  "ROOT_CANAL",
  "EXTRACTED",
  "IMPLANT",
  "MISSING",
  "VENEER",
];

const toothNames: Record<number, string> = {
  1: "Răng cửa giữa",
  2: "Răng cửa bên",
  3: "Răng nanh",
  4: "Răng cối nhỏ thứ nhất",
  5: "Răng cối nhỏ thứ hai",
  6: "Răng cối lớn thứ nhất",
  7: "Răng cối lớn thứ hai",
  8: "Răng khôn",
};
const toothName = (num: number) => toothNames[num % 10] ?? "Răng";

const routeApi = getRouteApi("/_authenticated/tooth-chart/");

function ToothButton({
  num,
  state,
  selected,
  lower,
  onClick,
}: {
  num: number;
  state: ToothState;
  selected: boolean;
  lower: boolean;
  onClick: () => void;
}) {
  const s = TOOTH_STATE[state];
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Răng ${num}`}
      className="h-[38px] w-[30px] cursor-pointer text-[10.5px] font-semibold tabular-nums transition-[filter] hover:brightness-95"
      style={{
        background: s.bg,
        color: s.fg,
        border: `1.5px solid ${selected ? "#0f7a73" : s.border}`,
        borderRadius: lower ? "10px 10px 6px 6px" : "6px 6px 10px 10px",
        boxShadow: selected ? "0 0 0 2px #cfe4e2" : undefined,
      }}
    >
      {num}
    </button>
  );
}

export function ToothChartPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const patientSeq = useRef(0);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [teeth, setTeeth] = useState<PatientTooth[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [history, setHistory] = useState<ToothStateHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingTooth, setSavingTooth] = useState(false);
  const chartSeq = useRef(0);
  const historySeq = useRef(0);

  // Nạp sẵn một trang bệnh nhân để có gợi ý trước khi gõ tìm kiếm.
  useEffect(() => {
    getPatients({ pageSize: 20 })
      .then((res) => setPatients(res.data))
      .catch(() => setPatients([]));
  }, []);

  // Tìm bệnh nhân theo tên/SĐT qua API; bỏ qua phản hồi cũ khi gõ nhanh.
  const handlePatientSearch = (query: string) => {
    const seq = ++patientSeq.current;
    setPatientLoading(true);
    getPatients({ searchKey: query.trim(), pageSize: 20 })
      .then((res) => {
        if (seq === patientSeq.current) setPatients(res.data);
      })
      .catch(() => {
        if (seq === patientSeq.current) setPatients([]);
      })
      .finally(() => {
        if (seq === patientSeq.current) setPatientLoading(false);
      });
  };

  // Tra răng theo số hiệu FDI để lấy `id` (dùng khi gọi PUT) và trạng thái hiện tại.
  const toothByNumber = useMemo(() => {
    const map = new Map<number, PatientTooth>();
    for (const t of teeth) map.set(t.toothNumber, t);
    return map;
  }, [teeth]);

  const stateOf = (num: number): ToothState => toothByNumber.get(num)?.state ?? "NORMAL";

  // Nạp lịch sử thay đổi của một chiếc răng; bỏ qua phản hồi cũ khi đổi răng nhanh.
  const loadHistory = (patientId: string, toothNumber: number) => {
    const seq = ++historySeq.current;
    setHistoryLoading(true);
    getToothHistory(patientId, toothNumber)
      .then((res) => {
        if (seq === historySeq.current) setHistory(res.data);
      })
      .catch(() => {
        if (seq === historySeq.current) setHistory([]);
      })
      .finally(() => {
        if (seq === historySeq.current) setHistoryLoading(false);
      });
  };

  const handleSelectPatient = async (id: string, name?: string) => {
    setSelectedPatientId(id);
    setSelectedPatientName(
      name ?? patients.find((p) => p.id === id)?.fullName ?? "",
    );
    setSelectedTooth(null);
    setHistory([]);
    setTeeth([]);

    const seq = ++chartSeq.current;
    setChartLoading(true);
    try {
      let data = await getOdontogram(id);
      // Bệnh nhân chưa có sơ đồ răng → khởi tạo bộ 32 răng mặc định rồi nạp lại.
      if (data.length === 0) {
        try {
          await createOdontogram(id);
          data = await getOdontogram(id);
        } catch {
          /* giữ mảng rỗng, hiển thị trạng thái trống */
        }
      }
      if (seq === chartSeq.current) setTeeth(data);
    } catch (err) {
      if (seq === chartSeq.current) {
        setTeeth([]);
        toast.error(
          err instanceof AxiosError
            ? (err.response?.data?.message ?? "Không thể tải sơ đồ răng.")
            : "Không thể tải sơ đồ răng.",
        );
      }
    } finally {
      if (seq === chartSeq.current) setChartLoading(false);
    }
  };

  // Preselect bệnh nhân khi điều hướng kèm ?patientId (vd từ trang chi tiết BN).
  const search = routeApi.useSearch();
  const preselectedRef = useRef(false);
  useEffect(() => {
    if (preselectedRef.current || !search.patientId) return;
    preselectedRef.current = true;
    const { patientId, patientName } = search;
    Promise.resolve().then(() => handleSelectPatient(patientId, patientName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.patientId, search.patientName]);

  const handleSelectTooth = (num: number) => {
    setSelectedTooth(num);
    if (selectedPatientId) loadHistory(selectedPatientId, num);
  };

  const handleSetToothState = async (num: number, state: ToothState) => {
    const tooth = toothByNumber.get(num);
    if (!selectedPatientId || !tooth || savingTooth) return;
    if (tooth.state === state) return;

    setSavingTooth(true);
    try {
      const updated = await updateTooth(tooth.id, { state });
      setTeeth((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      // Nạp lại lịch sử để lấy mốc mới (kèm người thực hiện) từ backend.
      loadHistory(selectedPatientId, num);
      toast.success(`Đã cập nhật trạng thái răng ${num}.`);
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể cập nhật trạng thái răng.")
          : "Không thể cập nhật trạng thái răng.",
      );
    } finally {
      setSavingTooth(false);
    }
  };

  const renderRow = (nums: number[], lower: boolean) =>
    nums.map((num) => (
      <ToothButton
        key={num}
        num={num}
        lower={lower}
        state={stateOf(num)}
        selected={selectedTooth === num}
        onClick={() => handleSelectTooth(num)}
      />
    ));

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Sơ đồ răng */}
      <div className="rounded-[14px] border border-border bg-card p-4.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5">
          <div className="shrink-0 text-[14.5px] font-semibold text-foreground">
            Sơ đồ răng
          </div>
          <SearchableSelect
            options={patients}
            value={selectedPatientId}
            onChange={handleSelectPatient}
            getOptionValue={(p) => p.id}
            getOptionLabel={(p) => p.fullName}
            placeholder="Chọn bệnh nhân"
            searchPlaceholder="Tìm theo tên hoặc số điện thoại"
            emptyMessage="Không tìm thấy bệnh nhân."
            onSearchChange={handlePatientSearch}
            loading={patientLoading}
            selectedLabel={selectedPatientName || undefined}
            className="w-55"
          />
          <div className="flex-1" />
          <div className="flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
            {STATE_ORDER.map((st) => (
              <div key={st} className="flex items-center gap-1.5">
                <span
                  className="size-2.25 rounded-[3px]"
                  style={{
                    background: TOOTH_STATE[st].bg,
                    border: `1px solid ${TOOTH_STATE[st].border}`,
                  }}
                />
                {TOOTH_STATE[st].label}
              </div>
            ))}
          </div>
        </div>

        {!selectedPatientId ? (
          <div className="mt-5 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#dfeceb] bg-[#f7fbfa] px-4 py-16 text-center">
            <div className="text-[13px] font-medium text-foreground">
              Chưa chọn bệnh nhân
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              Chọn một bệnh nhân ở trên để xem sơ đồ răng.
            </div>
          </div>
        ) : chartLoading ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#dfeceb] bg-[#f7fbfa] px-4 py-16 text-center text-[12.5px] text-muted-foreground">
            Đang tải sơ đồ răng…
          </div>
        ) : teeth.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#dfeceb] bg-[#f7fbfa] px-4 py-16 text-center text-[12.5px] text-muted-foreground">
            Chưa có dữ liệu sơ đồ răng cho bệnh nhân này.
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-col gap-2.5 rounded-xl border border-[#eaf3f2] bg-[#f7fbfa] px-1.5 py-4.5">
              <div className="text-center text-[11px] tracking-[0.08em] text-[#9fb3b1]">HÀM TRÊN</div>
              <div className="flex justify-center gap-4">
                <div className="flex gap-1">{renderRow(UPPER_RIGHT, false)}</div>
                <div className="flex gap-1">{renderRow(UPPER_LEFT, false)}</div>
              </div>
              <div className="mx-10 my-1.5 h-px bg-[#dfeceb]" />
              <div className="flex justify-center gap-4">
                <div className="flex gap-1">{renderRow(LOWER_RIGHT, true)}</div>
                <div className="flex gap-1">{renderRow(LOWER_LEFT, true)}</div>
              </div>
              <div className="text-center text-[11px] tracking-[0.08em] text-[#9fb3b1]">HÀM DƯỚI</div>
            </div>

            {/* Panel răng đang chọn */}
            <div className="mt-4.5 border-t border-[#f0f5f4] pt-4">
              {selectedTooth == null ? (
                <div className="text-[12.5px] text-muted-foreground">
                  Chọn một răng trên sơ đồ để ghi nhận hiện trạng.
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <div className="text-sm font-semibold text-foreground">Răng {selectedTooth}</div>
                    <div className="text-[12.5px] text-muted-foreground">
                      {toothName(selectedTooth)} · hiện trạng: {TOOTH_STATE[stateOf(selectedTooth)].label}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATE_ORDER.map((st) => {
                      const active = stateOf(selectedTooth) === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          disabled={savingTooth}
                          onClick={() => handleSetToothState(selectedTooth, st)}
                          className="cursor-pointer rounded-[9px] border px-3.25 py-1.75 text-[12.5px] font-medium transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            background: active ? TOOTH_STATE[st].bg : "#ffffff",
                            color: active ? TOOTH_STATE[st].fg : "#4a6664",
                            borderColor: active ? TOOTH_STATE[st].border : "#dde8e7",
                          }}
                        >
                          {TOOTH_STATE[st].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Lịch sử thay đổi */}
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="border-b border-[#e6efee] px-4.5 py-3.75">
          <div className="text-[14.5px] font-semibold text-foreground">Lịch sử thay đổi</div>
          {selectedPatientId && selectedTooth != null && (
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              Răng {selectedTooth} · {toothName(selectedTooth)}
            </div>
          )}
        </div>

        <div className="px-4.5 py-3.5">
          {!selectedPatientId ? (
            <div className="py-8 text-center text-[12.5px] text-muted-foreground">
              Chọn bệnh nhân để xem lịch sử thay đổi.
            </div>
          ) : selectedTooth == null ? (
            <div className="py-8 text-center text-[12.5px] text-muted-foreground">
              Chọn một răng trên sơ đồ để xem lịch sử thay đổi.
            </div>
          ) : historyLoading ? (
            <div className="py-8 text-center text-[12.5px] text-muted-foreground">
              Đang tải lịch sử…
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-muted-foreground">
              Chưa có lịch sử thay đổi cho răng này.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2.5 text-[12.5px]">
                  <span
                    className="size-1.75 shrink-0 rounded-full"
                    style={{ background: TOOTH_STATE[entry.state].fg }}
                  />
                  <span className="font-medium text-foreground">
                    {TOOTH_STATE[entry.state].label}
                  </span>
                  <span className="text-muted-foreground">
                    · {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                  {entry.changedBy && (
                    <span className="text-muted-foreground">· {entry.changedBy.fullName}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
