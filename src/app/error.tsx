"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error("Error page caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Ops! Algo não saiu como esperado
          </h1>
          <p className="text-gray-600">
            Encontramos um problema ao processar sua solicitação. Não se
            preocupe, você pode tentar novamente ou voltar para a página
            inicial.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-xs font-semibold text-red-900 mb-1">
              Detalhes do erro (apenas em desenvolvimento):
            </p>
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={reset} className="flex-1">
            Tentar novamente
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="flex-1"
          >
            Voltar ao início
          </Button>
        </div>
      </Card>
    </div>
  );
}
