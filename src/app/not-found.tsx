import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="space-y-2">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Página não encontrada
          </h1>
          <p className="text-gray-600">
            Desculpe, não conseguimos encontrar a página que você está
            procurando. Ela pode ter sido movida ou não existe mais.
          </p>
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href="/">Voltar ao início</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard">Ir para o Dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
