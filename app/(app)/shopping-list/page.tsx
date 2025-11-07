'use client';

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { MOCK_SHOPPING_LISTS, MOCK_PURCHASE_HISTORY } from "@/lib/constants";
import type { ShoppingList, ShoppingListItem, PurchaseRecord, PurchasedItem } from "@/lib/types";
import { SparklesIcon, PlusIcon, QrCodeIcon } from "@/components/assets/Icons";

// --- Helper Components ---

const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split("\n");
    return (
        <div className="prose prose-sm max-w-none text-on-surface-variant">
            {lines.map((line, index) => {
                if (line.startsWith("## ")) {
                    return (
                        <h2 key={index} className="text-lg font-medium text-on-surface mt-4 mb-2">
                            {line.substring(3)}
                        </h2>
                    );
                }
                if (line.startsWith("* ")) {
                    const lineContent = line.substring(2);
                    const parts = lineContent.split("**");
                    const renderedLine = parts.map((part, i) =>
                        i % 2 === 1 ? (
                            <strong key={i} className="font-medium text-on-surface">
                                {part}
                            </strong>
                        ) : (
                            part
                        )
                    );
                    return (
                        <li key={index} className="ml-4 list-disc">
                            {renderedLine}
                        </li>
                    );
                }
                if (line.trim() === "") return <br key={index} />;
                const parts = line.split("**");
                const renderedLine = parts.map((part, i) =>
                    i % 2 === 1 ? (
                        <strong key={i} className="font-medium text-on-surface">
                            {part}
                        </strong>
                    ) : (
                        part
                    )
                );
                return (
                    <p key={index} className="mb-2">
                        {renderedLine}
                    </p>
                );
            })}
        </div>
    );
};

const ParsedPurchaseCard: React.FC<{ purchase: Omit<PurchaseRecord, "id">; onSave: () => void }> = ({
    purchase,
    onSave,
}) => (
    <Card className="mt-6">
        <div className="p-4 bg-primary-container/30">
            <h4 className="text-xl font-medium mb-1">Nota Fiscal Importada</h4>
            <div className="flex justify-between text-on-surface-variant text-sm">
                <span>{purchase.storeName}</span>
                <span>{new Date(purchase.purchaseDate).toLocaleDateString("pt-BR")}</span>
            </div>
        </div>
        <div className="p-4 max-h-60 overflow-y-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-outline">
                    <tr>
                        <th className="py-2 font-medium">Produto</th>
                        <th className="py-2 font-medium text-center">Qtd</th>
                        <th className="py-2 font-medium text-right">Preço Unit.</th>
                        <th className="py-2 font-medium text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {purchase.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-2">{item.name}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-4 border-t border-outline flex justify-between items-center">
            <span className="font-medium text-lg">Total: {formatCurrency(purchase.totalAmount)}</span>
            <Button onClick={onSave}>Salvar no Histórico</Button>
        </div>
    </Card>
);

// --- Main Screen Component ---
export default function ShoppingListPage() {
    const [historicLists, setHistoricLists] = useState<ShoppingList[]>(MOCK_SHOPPING_LISTS);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>(MOCK_PURCHASE_HISTORY);

    const [newListItems, setNewListItems] = useState<ShoppingListItem[]>([]);
    const [newListTitle, setNewListTitle] = useState("");
    const [prompt, setPrompt] = useState("");
    const [isGeneratingList, setIsGeneratingList] = useState(false);
    const [manualItem, setManualItem] = useState("");

    const [nfeUrl, setNfeUrl] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [parsedPurchase, setParsedPurchase] = useState<Omit<PurchaseRecord, "id"> | null>(null);

    const [insights, setInsights] = useState<string | null>(null);
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

    // --- Create List Logic ---
    const handleGenerateList = async () => {
        if (!prompt) return;
        setIsGeneratingList(true);
        setNewListItems([]);

        try {
            const response = await fetch('/api/shopping-list/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate shopping list');
            }

            const data = await response.json();
            setNewListItems(data.items.map((name: string) => ({ $id: `item-${Math.random()}`, name, checked: false })));
            setNewListTitle(data.title);
        } catch (error) {
            console.error("Error generating shopping list:", error);
            alert(error instanceof Error ? error.message : 'Failed to generate shopping list. Please try again.');
        } finally {
            setIsGeneratingList(false);
        }
    };

    const handleToggleItem = (id: string) => {
        setNewListItems((prev) => prev.map((item) => (item.$id === id ? { ...item, checked: !item.checked } : item)));
    };

    const handleAddManualItem = () => {
        if (manualItem.trim()) {
            setNewListItems((prev) => [
                ...prev,
                { $id: `manual-${Date.now()}`, name: manualItem.trim(), checked: false },
            ]);
            setManualItem("");
        }
    };

    const handleSaveAndArchive = () => {
        if (newListItems.length === 0) return;
        const newList: ShoppingList = {
            $id: `list-${Date.now()}`,
            title: newListTitle || "Untitled List",
            createdAt: new Date().toISOString(),
            items: newListItems,
        };
        setHistoricLists((prev) => [newList, ...prev]);
        setNewListItems([]);
        setNewListTitle("");
        setPrompt("");
    };

    // --- Import NF-e Logic ---
    const handleImportNFe = async () => {
        if (!nfeUrl) return;
        setIsImporting(true);
        setParsedPurchase(null);

        try {
            const response = await fetch('/api/shopping-list/parse-nfe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nfeUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to parse NFe');
            }

            const parsedData = await response.json();
            setParsedPurchase(parsedData);
        } catch (error) {
            console.error("Error importing NF-e:", error);
            alert(error instanceof Error ? error.message : 'Failed to import NFe. Please check the URL and try again.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSavePurchase = () => {
        if (!parsedPurchase) return;
        const newRecord: PurchaseRecord = {
            ...parsedPurchase,
            $id: `pr-${Date.now()}`,
            nfeUrl: nfeUrl,
        };
        setPurchaseHistory((prev) => [newRecord, ...prev]);
        setParsedPurchase(null);
        setNfeUrl("");
    };

    // --- Insights Logic ---
    const handleGenerateInsights = async () => {
        if (purchaseHistory.length === 0) {
            alert('No purchase history available. Please import some purchases first.');
            return;
        }
        setIsGeneratingInsights(true);
        setInsights(null);

        try {
            const response = await fetch('/api/shopping-list/insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ purchaseHistory }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate insights');
            }

            const data = await response.json();
            setInsights(data.insights);
        } catch (error) {
            console.error("Error generating insights:", error);
            alert(error instanceof Error ? error.message : 'Failed to generate insights. Please try again.');
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    return (
        <div>
            <header className="mb-6">
                <h1 className="text-3xl font-normal text-on-surface">Inteligência de Compras</h1>
                <p className="text-base text-on-surface-variant mt-1">
                    Crie listas, importe compras e obtenha insights de economia com IA.
                </p>
            </header>

            <Card>
                <Tabs defaultValue="create">
                    <TabsList>
                        <TabsTrigger value="create">Criar Nova Lista</TabsTrigger>
                        <TabsTrigger value="import">Importar NF-e</TabsTrigger>
                        <TabsTrigger value="history">Histórico e Insights</TabsTrigger>
                    </TabsList>

                    {/* Create List Tab */}
                    <TabsContent value="create">
                        <div className="p-6 max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold text-on-surface">O que você precisa comprar?</h3>
                            <p className="text-sm text-on-surface-variant mb-4">
                                Ex: "Compras da semana", "Ingredientes para lasanha"
                            </p>
                            <div className="flex gap-2">
                                <textarea
                                    rows={2}
                                    className="w-full p-3 bg-surface border border-outline rounded-xl flex-grow"
                                    placeholder="Descreva suas necessidades de compra..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isGeneratingList}
                                />
                                <Button
                                    onClick={handleGenerateList}
                                    disabled={isGeneratingList || !prompt}
                                    leftIcon={<SparklesIcon className="w-5 h-5" />}
                                >
                                    {isGeneratingList ? "Gerando..." : "Gerar"}
                                </Button>
                            </div>
                            {isGeneratingList && (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            )}
                            {newListItems.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-xl font-semibold mb-4 text-on-surface">
                                        Sua Lista: <span className="text-primary">{newListTitle}</span>
                                    </h4>
                                    <ul className="space-y-2">
                                        {newListItems.map((item) => (
                                            <li
                                                key={item.$id}
                                                className="flex items-center p-2 rounded-md hover:bg-surface-variant/20"
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={item.$id}
                                                    checked={item.checked}
                                                    onChange={() => handleToggleItem(item.$id)}
                                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label
                                                    htmlFor={item.$id}
                                                    className={`ml-3 text-on-surface ${
                                                        item.checked ? "line-through text-on-surface-variant" : ""
                                                    }`}
                                                >
                                                    {item.name}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 pt-4 border-t border-outline flex gap-2">
                                        <Input
                                            id="manual-item"
                                            placeholder="Adicionar outro item..."
                                            value={manualItem}
                                            onChange={(e) => setManualItem(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddManualItem()}
                                        />
                                        <Button
                                            variant="outlined"
                                            onClick={handleAddManualItem}
                                            leftIcon={<PlusIcon className="w-5 h-5" />}
                                        >
                                            Adicionar
                                        </Button>
                                    </div>
                                    <div className="mt-6 text-right">
                                        <Button onClick={handleSaveAndArchive}>Salvar e Arquivar</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Import NF-e Tab */}
                    <TabsContent value="import">
                        <div className="p-6 max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold text-on-surface">Importar da URL da NF-e</h3>
                            <p className="text-sm text-on-surface-variant mb-4">
                                Cole a URL pública de uma Nota Fiscal Eletrônica brasileira para registrar automaticamente sua compra.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    id="nfe-url"
                                    placeholder="https://sat.sef.sc.gov.br/..."
                                    value={nfeUrl}
                                    onChange={(e) => setNfeUrl(e.target.value)}
                                    disabled={isImporting}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() => {}}
                                    leftIcon={<QrCodeIcon className="w-5 h-5" />}
                                >
                                    Escanear
                                </Button>
                                <Button onClick={handleImportNFe} disabled={isImporting || !nfeUrl}>
                                    {isImporting ? "Importando..." : "Importar"}
                                </Button>
                            </div>
                            {isImporting && (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            )}
                            {parsedPurchase && (
                                <ParsedPurchaseCard purchase={parsedPurchase} onSave={handleSavePurchase} />
                            )}
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <div className="p-6">
                            <div className="mb-6">
                                <Button
                                    onClick={handleGenerateInsights}
                                    disabled={isGeneratingInsights}
                                    leftIcon={<SparklesIcon className="w-5 h-5" />}
                                >
                                    {isGeneratingInsights ? "Analisando..." : "Gerar Insights de Economia"}
                                </Button>
                            </div>

                            {isGeneratingInsights && (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            )}
                            {insights && (
                                <Card className="p-6 mb-8 bg-primary-container/50 border border-primary/20">
                                    <MarkdownRenderer content={insights} />
                                </Card>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface mb-4">Histórico de Compras</h3>
                                    <div className="space-y-3">
                                        {purchaseHistory.length > 0 ? (
                                            purchaseHistory.map((rec) => (
                                                <Card key={rec.$id} className="p-4 bg-surface">
                                                    <details>
                                                        <summary className="font-medium text-on-surface cursor-pointer flex justify-between items-center">
                                                            <div>
                                                                <p>{rec.storeName}</p>
                                                                <p className="text-xs text-on-surface-variant">
                                                                    {formatDate(rec.purchaseDate)}
                                                                </p>
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {formatCurrency(rec.totalAmount)}
                                                            </span>
                                                        </summary>
                                                        <div className="mt-3 pt-3 border-t border-outline text-xs text-on-surface-variant">
                                                            {rec.items.map((item, i) => (
                                                                <p key={i}>
                                                                    {item.quantity}x {item.name}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </details>
                                                </Card>
                                            ))
                                        ) : (
                                            <p className="text-center text-on-surface-variant py-8 text-sm">
                                                Nenhum histórico de compras ainda.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface mb-4">Listas de Compras Anteriores</h3>
                                    <div className="space-y-3">
                                        {historicLists.length > 0 ? (
                                            historicLists.map((list) => (
                                                <Card key={list.$id} className="p-4 bg-surface">
                                                    <details>
                                                        <summary className="font-medium text-on-surface cursor-pointer flex justify-between items-center">
                                                            <div>
                                                                <p>{list.title}</p>
                                                                <p className="text-xs text-on-surface-variant">
                                                                    Criado: {formatDate(list.createdAt)}
                                                                </p>
                                                            </div>
                                                            <span className="text-sm text-on-surface-variant">
                                                                {list.items.length} itens
                                                            </span>
                                                        </summary>
                                                        <ul className="mt-3 pt-3 border-t border-outline space-y-1">
                                                            {list.items.map((item) => (
                                                                <li key={item.$id} className="flex items-center text-sm">
                                                                    <span
                                                                        className={`mr-2 ${
                                                                            item.checked
                                                                                ? "text-secondary"
                                                                                : "text-on-surface-variant"
                                                                        }`}
                                                                    >
                                                                        {item.checked ? "✓" : "•"}
                                                                    </span>
                                                                    <span
                                                                        className={`${
                                                                            item.checked
                                                                                ? "line-through text-on-surface-variant"
                                                                                : "text-on-surface"
                                                                        }`}
                                                                    >
                                                                        {item.name}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </details>
                                                </Card>
                                            ))
                                        ) : (
                                            <p className="text-center text-on-surface-variant py-8 text-sm">
                                                Nenhum histórico de listas de compras ainda.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
