"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Validation schema matching the API
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    role: string;
  };
}

interface ErrorResponse {
  error: string;
  details?: Array<{ message: string }>;
}

async function loginUser(data: LoginFormData): Promise<LoginResponse> {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ErrorResponse;
  }

  return result;
}

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      // Redirect to onboarding welcome page on success
      router.push("/onboarding/welcome");
    },
    onError: (error: ErrorResponse) => {
      // Handle server errors
      if (error.details && error.details.length > 0) {
        setServerError(error.details.map((d) => d.message).join(", "));
      } else {
        setServerError(error.error || "Erro ao fazer login");
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError("");
    mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Entre na sua conta para acessar suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                autoComplete="current-password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server Error */}
            {serverError && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                {serverError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Entrando..." : "Entrar"}
            </Button>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-600">
              Não tem uma conta?{" "}
              <a
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Criar conta
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
