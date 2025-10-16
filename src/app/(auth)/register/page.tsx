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
const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string | null;
    role: string;
    created_at: string;
  };
}

interface ErrorResponse {
  error: string;
  details?: Array<{ message: string }>;
}

async function registerUser(data: RegisterFormData): Promise<RegisterResponse> {
  const response = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ErrorResponse;
  }

  return result;
}

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // Redirect to login on success
      router.push("/login");
    },
    onError: (error: ErrorResponse) => {
      // Handle server errors
      if (error.details && error.details.length > 0) {
        setServerError(error.details.map((d) => d.message).join(", "));
      } else {
        setServerError(error.error || "Erro ao criar conta");
      }
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setServerError("");
    mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Crie sua conta para começar a gerenciar suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name Field */}
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Seu nome"
                {...register("firstName")}
                aria-invalid={errors.firstName ? "true" : "false"}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
              />
              {errors.firstName && (
                <p
                  id="firstName-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name Field */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome (opcional)</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Seu sobrenome"
                {...register("lastName")}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
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
                placeholder="Mínimo 8 caracteres"
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
              {mutation.isPending ? "Criando conta..." : "Criar Conta"}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Fazer login
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
