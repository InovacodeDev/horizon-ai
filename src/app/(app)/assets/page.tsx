"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AssetsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Ativos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus produtos, garantias e notas fiscais
          </p>
        </div>
        <Button
          size="sm"
          className="bg-primary text-on-primary hover:bg-primary/90 rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar NF-e
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-outline/20 p-8 text-center">
        <p className="text-muted-foreground">
          Página de ativos em desenvolvimento
        </p>
      </div>
    </main>
  );
}
