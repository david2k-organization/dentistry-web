import { getRouteApi, useNavigate } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

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
        </CardContent>
      </Card>
    </div>
  );
}
