"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState, ErrorState } from "@/components/states";

export default function OpenFinanceCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get authorization code and state from URL
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Check if user cancelled or error occurred
      if (errorParam) {
        if (errorParam === "access_denied") {
          setError(
            "Você cancelou a conexão com o banco. Tente novamente quando estiver pronto."
          );
        } else {
          setError(
            errorDescription ||
              "Ocorreu um erro ao conectar com o banco. Por favor, tente novamente."
          );
        }
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setError(
          "Parâmetros de autorização inválidos. Por favor, tente novamente."
        );
        return;
      }

      try {
        // Exchange authorization code for access token
        const response = await fetch("/api/v1/of/exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            state,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to establish connection");
        }

        const data = await response.json();

        if (data.success) {
          // Redirect to dashboard on success
          router.push("/dashboard");
        } else {
          throw new Error("Connection failed");
        }
      } catch (err) {
        console.error("Exchange error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao processar a conexão. Por favor, tente novamente."
        );
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorState
            title="Erro na Conexão"
            message={error}
            onSecondaryAction={() => router.push("/onboarding/select-bank")}
            secondaryActionLabel="Voltar para Seleção de Banco"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <LoadingState message="Conectando sua conta... Estamos estabelecendo uma conexão segura com seu banco e sincronizando seus dados." />
      </div>
    </div>
  );
}
