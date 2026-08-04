import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendOtp } from "./api";

const emailFormSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

type ForgotPasswordEmailStepProps = {
  /** Email đã nhập trước đó (khi quay lại bước này). */
  defaultEmail?: string;
  /** Gọi khi gửi OTP thành công, kèm email đã xác nhận. */
  onOtpSent: (email: string) => void;
};

export function ForgotPasswordEmailStep({
  defaultEmail = "",
  onOtpSent,
}: ForgotPasswordEmailStepProps) {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    try {
      await sendOtp({ email, type: "FORGOT_PASSWORD" });
      toast.success("Đã gửi mã OTP về email của bạn");
      onOtpSent(email);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Gửi mã OTP thất bại.")
          : "Gửi mã OTP thất bại.";
      toast.error(message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            autoFocus
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-6 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Đang gửi mã..." : "Gửi mã xác nhận"}
      </Button>
    </form>
  );
}
