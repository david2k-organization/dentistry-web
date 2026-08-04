import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgetPassword, sendOtp } from "./api";

const resetFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Mã OTP gồm 6 chữ số"),
    newPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(100, "Mật khẩu tối đa 100 ký tự"),
    confirmNewPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
  });

type ResetFormValues = z.infer<typeof resetFormSchema>;

const RESEND_COOLDOWN_SECONDS = 60;

type ForgotPasswordResetStepProps = {
  email: string;
  /** Đặt lại mật khẩu thành công. */
  onSuccess: () => void;
  /** Quay lại bước nhập email. */
  onBack: () => void;
};

export function ForgotPasswordResetStep({
  email,
  onSuccess,
  onBack,
}: ForgotPasswordResetStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { code: "", newPassword: "", confirmNewPassword: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await forgetPassword({ email, ...values });
      toast.success("Đổi mật khẩu thành công, vui lòng đăng nhập");
      onSuccess();
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Đặt lại mật khẩu thất bại.")
          : "Đặt lại mật khẩu thất bại.";
      toast.error(message);
    }
  });

  const handleResend = async () => {
    setResending(true);
    try {
      await sendOtp({ email, type: "FORGOT_PASSWORD" });
      toast.success("Đã gửi lại mã OTP");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Gửi lại mã thất bại.")
          : "Gửi lại mã thất bại.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.code}>
          <FieldLabel htmlFor="code">Mã OTP</FieldLabel>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            autoFocus
            className="text-center text-2xl tracking-[0.5em]"
            aria-invalid={!!form.formState.errors.code}
            {...form.register("code")}
          />
          <FieldError errors={[form.formState.errors.code]} />
        </Field>

        <Field data-invalid={!!form.formState.errors.newPassword}>
          <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mật khẩu mới"
              className="pr-8"
              aria-invalid={!!form.formState.errors.newPassword}
              {...form.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError errors={[form.formState.errors.newPassword]} />
        </Field>

        <Field data-invalid={!!form.formState.errors.confirmNewPassword}>
          <FieldLabel htmlFor="confirmNewPassword">Xác nhận mật khẩu</FieldLabel>
          <Input
            id="confirmNewPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            aria-invalid={!!form.formState.errors.confirmNewPassword}
            {...form.register("confirmNewPassword")}
          />
          <FieldError errors={[form.formState.errors.confirmNewPassword]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-6 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Đang xác nhận..." : "Xác nhận"}
      </Button>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          Đổi email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã"}
        </button>
      </div>
    </form>
  );
}
