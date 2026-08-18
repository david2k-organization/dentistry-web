type PatientAdminInfoProps = {
  code: string;
  doctor: string;
  phone: string;
  /** Nhãn lần khám gần nhất đã dựng sẵn (ngày — dịch vụ) hoặc "—". */
  lastVisit: string;
  address: string;
  allergy: string;
  notes: string;
};

/** Thẻ "Thông tin hành chính" của hồ sơ bệnh nhân. */
export function PatientAdminInfo({
  code,
  doctor,
  phone,
  lastVisit,
  address,
  allergy,
  notes,
}: PatientAdminInfoProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="border-b border-[#e6efee] px-4.5 py-3.75 text-[14.5px] font-semibold text-foreground">
        Thông tin hành chính
      </div>
      <div className="px-4.5">
        <DetailField label="Mã hồ sơ" value={code} />
        <DetailField label="Bác sĩ phụ trách" value={doctor} />
        <DetailField label="Điện thoại" value={phone} />
        <DetailField label="Lần khám gần nhất" value={lastVisit} />
        <DetailField label="Địa chỉ" value={address} />
        <DetailField
          label="Tiền sử dị ứng"
          value={allergy}
          valueColor={allergy === "Không ghi nhận" ? undefined : "#a4553a"}
        />
        <DetailField label="Ghi chú lâm sàng" value={notes} last />
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
