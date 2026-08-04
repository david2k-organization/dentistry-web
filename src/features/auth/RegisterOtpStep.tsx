import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendOtp } from "./api";

const otpFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Mã OTP gồm 6 chữ số"),
});

type OtpFormValues = z.infer<typeof otpFormSchema>;

const RESEND_COOLDOWN_SECONDS = 60;

type RegisterOtpStepProps = {
  email: string;
  defaultCode?: string;
  onOtpConfirmed: (code: string) => void;
  onBack: () => void;
};

export function RegisterOtpStep({
  email,
  defaultCode = "",
  onOtpConfirmed,
  onBack,
}: RegisterOtpStepProps) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { code: defaultCode },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = form.handleSubmit(({ code }) => {
    onOtpConfirmed(code);
  });

  const handleResend = async () => {
    setResending(true);
    try {
      await sendOtp({ email, type: "REGISTER" });
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
      </FieldGroup>

      <Button type="submit" className="mt-6 w-full" disabled={form.formState.isSubmitting}>
        Xác nhận mã OTP
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
