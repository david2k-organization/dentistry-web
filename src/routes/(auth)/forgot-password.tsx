import { createFileRoute, redirect } from "@tanstack/react-router";

import { isAuthenticated } from "@/features/auth/auth-storage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";

export const Route = createFileRoute("/(auth)/forgot-password")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: ForgotPasswordPage,
});
