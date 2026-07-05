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
import { login } from "./api";
import { setTokens } from "./auth-storage";

const loginFormSchema = z.object({
  userName: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

type LoginFormProps = {
  onSuccess: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      userName: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const tokens = await login(values);
      setTokens(tokens);
      toast.success("Đăng nhập thành công");
      onSuccess();
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Đăng nhập thất bại.")
          : "Đăng nhập thất bại.";
      toast.error(message);
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
            autoFocus
            aria-invalid={!!form.formState.errors.userName}
            {...form.register("userName")}
          />
          <FieldError errors={[form.formState.errors.userName]} />
        </Field>

        <Field data-invalid={!!form.formState.errors.password}>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
      </FieldGroup>

      <Button type="submit" className="mt-6 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
