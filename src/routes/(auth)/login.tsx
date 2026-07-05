import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { isAuthenticated } from "@/features/auth/auth-storage";
import { LoginPage } from "@/features/auth/login-page";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/(auth)/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});
