import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterEmailStep } from "@/features/auth/RegisterEmailStep";
import { RegisterOtpStep } from "@/features/auth/RegisterOtpStep";
import { RegisterPasswordStep } from "@/features/auth/RegisterPasswordStep";

type Step = "email" | "otp" | "password";

const stepMeta: Record<Step, { title: string; description: string }> = {
  email: {
    title: "Đăng ký tài khoản",
    description: "Nhập email của bạn để nhận mã xác nhận (OTP).",
  },
  otp: {
    title: "Xác nhận email",
    description: "Nhập mã OTP gồm 6 chữ số vừa được gửi tới email của bạn.",
  },
  password: {
    title: "Tạo mật khẩu",
    description: "Thiết lập thông tin đăng nhập để hoàn tất đăng ký.",
  },
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

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
            <RegisterEmailStep
              defaultEmail={email}
              onOtpSent={(value) => {
                setEmail(value);
                setStep("otp");
              }}
            />
          )}

          {step === "otp" && (
            <RegisterOtpStep
              email={email}
              defaultCode={code}
              onOtpConfirmed={(value) => {
                setCode(value);
                setStep("password");
              }}
              onBack={() => setStep("email")}
            />
          )}

          {step === "password" && (
            <RegisterPasswordStep
              email={email}
              code={code}
              onSuccess={() => navigate({ to: "/login" })}
              onOtpInvalid={() => setStep("otp")}
            />
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
