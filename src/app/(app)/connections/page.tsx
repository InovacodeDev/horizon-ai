"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function ConnectionsPage() {
  const router = useRouter();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Conexões</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas conexões bancárias e sincronizações
          </p>
        </div>
        <Button
          onClick={() => router.push("/select-bank")}
          size="sm"
          className="bg-primary text-on-primary hover:bg-primary/90 rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova conexão
        </Button>
      </div>

      <div className="bg-card rounded-[var(--md-sys-shape-corner-medium)] border border-outline/20 p-8 text-center">
        <p className="text-muted-foreground">
          Página de conexões em desenvolvimento
        </p>
      </div>
    </main>
  );
}
