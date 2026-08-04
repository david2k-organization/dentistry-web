import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/LoginForm";

const routeApi = getRouteApi("/(auth)/login");

export function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = routeApi.useSearch();

  const handleSuccess = () => {
    navigate({ to: redirectTo || "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Dental Clinic Manager</CardTitle>
          <CardDescription>Đăng nhập để tiếp tục vào hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={handleSuccess} />
          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Đăng ký
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
