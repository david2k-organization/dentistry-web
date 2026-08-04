import { createFileRoute, redirect } from "@tanstack/react-router";

import { isAuthenticated } from "@/features/auth/auth-storage";
import { RegisterPage } from "@/features/auth/RegisterPage";

export const Route = createFileRoute("/(auth)/register")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: RegisterPage,
});
