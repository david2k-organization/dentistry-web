import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { register as registerApi } from "./api";

const passwordFormSchema = z
  .object({
    userName: z.string().trim().min(4, "Tên đăng nhập tối thiểu 4 ký tự"),
    fullName: z.string().trim().min(4, "Họ tên tối thiểu 4 ký tự"),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

type RegisterPasswordStepProps = {
  email: string;
  code: string;
  onSuccess: () => void;
  onOtpInvalid: () => void;
};

export function RegisterPasswordStep({
  email,
  code,
  onSuccess,
  onOtpInvalid,
}: RegisterPasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      userName: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerApi({ ...values, email, code });
      toast.success("Đăng ký thành công, vui lòng đăng nhập");
      onSuccess();
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Đăng ký thất bại.")
          : "Đăng ký thất bại.";
      toast.error(message);
      if (message.toLowerCase().includes("otp")) {
        onOtpInvalid();
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.userName}>
          <FieldLabel htmlFor="userName">Tên đăng nhập</FieldLabel>
          <Input
            id="userName"
            autoComplete="username"
            placeholder="Tên đăng nhập"
            autoFocus
            aria-invalid={!!form.formState.errors.userName}
            {...form.register("userName")}
          />
          <FieldError errors={[form.formState.errors.userName]} />
        </Field>

        <Field data-invalid={!!form.formState.errors.fullName}>
          <FieldLabel htmlFor="fullName">Họ và tên</FieldLabel>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            aria-invalid={!!form.formState.errors.fullName}
            {...form.register("fullName")}
          />
          <FieldError errors={[form.formState.errors.fullName]} />
        </Field>

        <Field data-invalid={!!form.formState.errors.password}>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mật khẩu"
              className="pr-8"
              aria-invalid={!!form.formState.errors.password}
              {...form.register("password")}
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
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field data-invalid={!!form.formState.errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            aria-invalid={!!form.formState.errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[form.formState.errors.confirmPassword]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-6 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
      </Button>
    </form>
  );
}
