import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordEmailStep } from "@/features/auth/ForgotPasswordEmailStep";
import { ForgotPasswordResetStep } from "@/features/auth/ForgotPasswordResetStep";

type Step = "email" | "reset";

const stepMeta: Record<Step, { title: string; description: string }> = {
  email: {
    title: "Quên mật khẩu",
    description: "Nhập email của bạn để nhận mã xác nhận (OTP).",
  },
  reset: {
    title: "Đặt lại mật khẩu",
    description: "Nhập mã OTP và mật khẩu mới để hoàn tất.",
  },
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const { title, description } = stepMeta[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <ForgotPasswordEmailStep
              defaultEmail={email}
              onOtpSent={(value) => {
                setEmail(value);
                setStep("reset");
              }}
            />
          )}

          {step === "reset" && (
            <ForgotPasswordResetStep
              email={email}
              onSuccess={() => navigate({ to: "/login" })}
              onBack={() => setStep("email")}
            />
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nhớ lại mật khẩu?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
