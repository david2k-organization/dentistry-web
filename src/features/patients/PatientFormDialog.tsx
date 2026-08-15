import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { uploadImageViaPresign } from "@/features/media/api";
import { createPatient, updatePatient } from "./api";
import {
  dateOnlyStringToDate,
  dateOnlyToIsoWithOffset,
  dateToDateOnlyString,
  fileToDataUrl,
  getInitials,
  isoToDateInputValue,
} from "./format";
import {
  getPatientMock,
  setPatientMock,
  TAG_OPTIONS,
  type PatientTag,
} from "./mock";
import type { Gender, Patient } from "./types";

const emptyToUndefined = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : value;

const patientFormSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên").max(255),
  phone: z
    .string()
    .trim()
    .max(20, "Tối đa 20 ký tự")
    .optional()
    .transform(emptyToUndefined),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform(emptyToUndefined)
    .pipe(z.string().email("Email không hợp lệ").optional()),
  dateOfBirth: z.string().optional().transform(emptyToUndefined),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Tối đa 2000 ký tự")
    .optional()
    .transform(emptyToUndefined),
});

type PatientFormValues = z.input<typeof patientFormSchema>;

type PatientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSaved: (patient: Patient) => void;
};

const emptyValues: PatientFormValues = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: undefined,
  notes: "",
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Nữ" },
  { value: "MALE", label: "Nam" },
  { value: "OTHER", label: "Khác" },
];

function valuesFromPatient(patient: Patient): PatientFormValues {
  return {
    fullName: patient.fullName,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    dateOfBirth: isoToDateInputValue(patient.dateOfBirth),
    gender: patient.gender ?? undefined,
    notes: patient.notes ?? "",
  };
}

function FieldBox({
  label,
  span,
  invalid,
  hint,
  children,
}: {
  label: string;
  span?: "full" | "half";
  invalid?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={span === "full" ? "col-span-2" : undefined}>
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div
        className="mt-1.5 flex items-center gap-2 rounded-[11px] border bg-card px-3.5"
        style={{ borderColor: invalid ? "#e8cfc4" : "#dde8e7" }}
      >
        {children}
      </div>
      {hint && <div className="mt-1 text-[11px] text-[#a4553a]">{hint}</div>}
    </div>
  );
}

const boxInputClass =
  "flex-1 min-w-0 border-0 bg-transparent py-2.5 font-sans text-[13px] text-foreground outline-none placeholder:text-muted-foreground";

// Giới hạn kích thước ảnh đại diện (lưu dưới dạng data URL trong bộ nhớ).
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSaved,
}: PatientFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dobOpen, setDobOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [allergy, setAllergy] = useState("");
  const [tag, setTag] = useState<PatientTag>("Mới");
  const [avatar, setAvatar] = useState<string | null>(null);
  // File ảnh mới vừa chọn, sẽ upload lên S3 (presigned URL) khi bấm Lưu.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!patient;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(patient ? valuesFromPatient(patient) : emptyValues);
      setSubmitError(null);
      setAvatarError(null);
      const mock = patient ? getPatientMock(patient.id) : null;
      setAddress(mock?.address ?? "");
      setAllergy(mock?.allergy ?? "Không ghi nhận");
      setTag(mock?.tag ?? "Mới");
      setAvatar(patient?.avatar ?? mock?.avatar ?? null);
      setAvatarFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Cho phép chọn lại cùng một file sau khi xoá.
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Vui lòng chọn tệp ảnh.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Ảnh tối đa 5MB.");
      return;
    }
    try {
      // Hiển thị preview ngay bằng data URL; ảnh sẽ được upload lên S3 khi Lưu.
      setAvatar(await fileToDataUrl(file));
      setAvatarFile(file);
      setAvatarError(null);
    } catch {
      setAvatarError("Không đọc được ảnh, vui lòng thử lại.");
    }
  };

  const dateOfBirth = form.watch("dateOfBirth");
  const gender = form.watch("gender");
  const fullName = form.watch("fullName");

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    // Có ảnh mới → upload lên S3 qua presigned URL, lấy URL public để lưu.
    let avatarUrl = avatar;
    if (avatarFile) {
      try {
        avatarUrl = await uploadImageViaPresign(avatarFile);
        setAvatar(avatarUrl);
        setAvatarFile(null);
      } catch {
        setAvatarError("Không tải được ảnh lên, vui lòng thử lại.");
        return;
      }
    }

    const payload = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      gender: values.gender,
      notes: values.notes,
      dateOfBirth: values.dateOfBirth
        ? dateOnlyToIsoWithOffset(values.dateOfBirth)
        : undefined,
      avatar: avatarUrl || "",
    };
    const mockPatch = {
      address: address.trim() || "Chưa cập nhật",
      allergy,
      tag,
      avatar: avatarUrl,
    };
    try {
      if (patient) {
        await updatePatient(patient.id, payload);
        setPatientMock(patient.id, mockPatch);
        onSaved({
          ...patient,
          fullName: payload.fullName,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          gender: payload.gender ?? null,
          notes: payload.notes ?? null,
          dateOfBirth: payload.dateOfBirth ?? null,
          avatar: avatarUrl,
        });
      } else {
        const created = await createPatient(payload);
        setPatientMock(created.id, mockPatch);
        onSaved(created);
      }
      handleOpenChange(false);
    } catch (error) {
      const fallback = isEditing
        ? "Không thể cập nhật bệnh nhân."
        : "Không thể tạo bệnh nhân.";
      if (error instanceof AxiosError) {
        setSubmitError(error.response?.data?.message ?? fallback);
      } else {
        setSubmitError(fallback);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa hồ sơ bệnh nhân" : "Thêm bệnh nhân mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin bệnh nhân."
              : "Nhập thông tin bệnh nhân mới."}
          </DialogDescription>
        </DialogHeader>

        <form id="patient-form" onSubmit={onSubmit}>
          <div className="mb-3.5 flex items-center gap-3.5">
            <div className="size-[58px] shrink-0 overflow-hidden rounded-full bg-accent">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Ảnh đại diện bệnh nhân"
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-lg font-semibold text-primary">
                  {fullName ? getInitials(fullName) : "BN"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] text-muted-foreground">
                Ảnh đại diện
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  {avatar ? "Đổi ảnh" : "Tải ảnh lên"}
                </Button>
                {avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-[#a4553a] hover:text-[#a4553a]"
                    onClick={() => {
                      setAvatar(null);
                      setAvatarFile(null);
                      setAvatarError(null);
                    }}
                  >
                    <Trash2 className="size-4" />
                    Xoá ảnh
                  </Button>
                )}
              </div>
              {avatarError ? (
                <div className="mt-1 text-[11px] text-[#a4553a]">
                  {avatarError}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  JPG, PNG — tối đa 2MB
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <FieldBox
              label="Họ và tên"
              span="full"
              invalid={!!form.formState.errors.fullName}
              hint={form.formState.errors.fullName?.message}
            >
              <input
                id="fullName"
                placeholder="VD: Nguyễn Thị Hồng"
                className={boxInputClass}
                aria-invalid={!!form.formState.errors.fullName}
                {...form.register("fullName")}
              />
            </FieldBox>

            <FieldBox
              label="Số điện thoại"
              invalid={!!form.formState.errors.phone}
              hint={form.formState.errors.phone?.message}
            >
              <input
                id="phone"
                placeholder="09xx xxx xxx"
                className={boxInputClass}
                aria-invalid={!!form.formState.errors.phone}
                {...form.register("phone")}
              />
            </FieldBox>

            <FieldBox
              label="Email"
              invalid={!!form.formState.errors.email}
              hint={form.formState.errors.email?.message}
            >
              <input
                id="email"
                type="email"
                placeholder="ten@vidu.com"
                className={boxInputClass}
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
            </FieldBox>

            <FieldBox label="Ngày sinh">
              <Popover open={dobOpen} onOpenChange={setDobOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer items-center gap-2 py-2.5 text-left text-[13px]"
                  >
                    <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                    {dateOfBirth ? (
                      <span className="text-foreground">
                        {format(
                          dateOnlyStringToDate(dateOfBirth),
                          "dd/MM/yyyy",
                          { locale: vi },
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Chọn ngày sinh
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={vi}
                    captionLayout="dropdown"
                    selected={
                      dateOfBirth
                        ? dateOnlyStringToDate(dateOfBirth)
                        : undefined
                    }
                    onSelect={(date) => {
                      form.setValue(
                        "dateOfBirth",
                        date ? dateToDateOnlyString(date) : "",
                      );
                      setDobOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </FieldBox>

            <FieldBox label="Địa chỉ" span="full">
              <input
                id="address"
                placeholder="Số nhà, đường, quận"
                className={boxInputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FieldBox>

            <FieldBox label="Tiền sử dị ứng" span="full">
              <input
                id="allergy"
                placeholder="VD: dị ứng Penicillin"
                className={boxInputClass}
                value={allergy}
                onChange={(e) => setAllergy(e.target.value)}
              />
            </FieldBox>

            <FieldBox label="Ghi chú lâm sàng" span="full">
              <textarea
                id="notes"
                rows={2}
                placeholder="VD: sợ tiếng khoan, cần gây tê kỹ"
                className={`${boxInputClass} resize-none py-2.5`}
                aria-invalid={!!form.formState.errors.notes}
                {...form.register("notes")}
              />
            </FieldBox>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-3.5">
            <div>
              <div className="text-[11.5px] text-muted-foreground">
                Giới tính
              </div>
              <div className="mt-1.5 flex gap-2">
                {GENDER_OPTIONS.map((g) => {
                  const active = gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => form.setValue("gender", g.value)}
                      className="cursor-pointer rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition-[filter] hover:brightness-95"
                      style={
                        active
                          ? {
                              background: "#0f7a73",
                              color: "#ffffff",
                              borderColor: "#0f7a73",
                            }
                          : {
                              background: "#ffffff",
                              color: "#4a6664",
                              borderColor: "#dde8e7",
                            }
                      }
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11.5px] text-muted-foreground">
                Trạng thái hồ sơ
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {TAG_OPTIONS.map((t) => {
                  const active = tag === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className="cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-[filter] hover:brightness-95"
                      style={
                        active
                          ? {
                              background: "#0f7a73",
                              color: "#ffffff",
                              borderColor: "#0f7a73",
                            }
                          : {
                              background: "#ffffff",
                              color: "#4a6664",
                              borderColor: "#dde8e7",
                            }
                      }
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {submitError && (
            <p role="alert" className="mt-3.5 text-sm text-destructive">
              {submitError}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="patient-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
