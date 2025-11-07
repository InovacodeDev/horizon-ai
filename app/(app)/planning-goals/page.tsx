'use client';

import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import {
    MOCK_FINANCIAL_GOALS,
    MOCK_RETIREMENT_GOAL,
    MOCK_BALANCE,
    MOCK_MONTHLY_INCOME,
    MOCK_MONTHLY_EXPENSES,
    MOCK_TRANSACTIONS,
} from "@/lib/constants";
import type { FinancialGoal, SuggestedGoal } from "@/lib/types";
import {
    PlusIcon,
    HomeIcon,
    PlaneIcon,
    LandmarkIcon,
    TargetIcon,
    EditIcon,
    Trash2Icon,
    TrendingUpIcon,
    SparklesIcon,
} from "@/components/assets/Icons";

const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

const getGoalIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("house") || lowerName.includes("casa") || lowerName.includes("imóvel")) {
        return <HomeIcon className="w-6 h-6 text-on-primary-container" />;
    }
    if (lowerName.includes("vacation") || lowerName.includes("viagem")) {
        return <PlaneIcon className="w-6 h-6 text-on-primary-container" />;
    }
    if (lowerName.includes("education") || lowerName.includes("estudos") || lowerName.includes("faculdade")) {
        return <LandmarkIcon className="w-6 h-6 text-on-primary-container" />;
    }
    return <TargetIcon className="w-6 h-6 text-on-primary-container" />;
};

const RetirementGoalCard: React.FC = () => {
    const { targetAge, targetSavings, currentSavings, monthlyContribution } = MOCK_RETIREMENT_GOAL;
    const progress = (currentSavings / targetSavings) * 100;

    return (
        <Card className="p-6 bg-primary-container border-primary">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-surface rounded-full">
                    <TrendingUpIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-medium text-on-primary-container">Plano de Aposentadoria</h3>
                    <p className="text-sm text-on-primary-container/80">No caminho para se aposentar aos {targetAge} anos.</p>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-on-primary-container font-medium">{formatCurrency(currentSavings)}</span>
                    <span className="text-on-primary-container font-medium">{formatCurrency(targetSavings)}</span>
                </div>
                <div className="w-full bg-primary/20 rounded-full h-3">
                    <div className="bg-primary rounded-full h-3" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-on-primary-container">
                        Contribuição mensal atual: <strong>{formatCurrency(monthlyContribution)}</strong>
                    </p>
                    <Button variant="ghost" className="!text-primary">
                        Ajustar Plano
                    </Button>
                </div>
            </div>
        </Card>
    );
};

// --- Goal Card Component ---
interface FinancialGoalCardProps {
    goal: FinancialGoal;
    onEdit: (goal: FinancialGoal) => void;
    onDelete: (goal: FinancialGoal) => void;
}

const FinancialGoalCard: React.FC<FinancialGoalCardProps> = ({ goal, onEdit, onDelete }) => {
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const isCompleted = progress >= 100;

    return (
        <Card className="p-5 flex flex-col h-full">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-container rounded-full">{getGoalIcon(goal.name)}</div>
                <div className="flex-grow">
                    <h3 className="font-medium text-lg text-on-surface">{goal.name}</h3>
                    <p className="text-sm text-on-surface-variant">Data Alvo: {goal.targetDate}</p>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" className="!p-2 !h-auto !rounded-full" onClick={() => onEdit(goal)}>
                        <EditIcon className="w-5 h-5 text-on-surface-variant" />
                    </Button>
                    <Button variant="ghost" className="!p-2 !h-auto !rounded-full" onClick={() => onDelete(goal)}>
                        <Trash2Icon className="w-5 h-5 text-error" />
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex-grow flex flex-col justify-end">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm text-on-surface-variant">Progresso</span>
                    <span className={`text-xl font-medium ${isCompleted ? "text-secondary" : "text-on-surface"}`}>
                        {progress.toFixed(0)}%
                    </span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-2.5">
                    <div
                        className={`${
                            isCompleted ? "bg-secondary" : "bg-primary"
                        } rounded-full h-2.5 transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between items-center mt-1 text-xs text-on-surface-variant">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                </div>
            </div>
        </Card>
    );
};

// --- Main Screen Component ---
export default function PlanningGoalsPage() {
    const [goals, setGoals] = useState<FinancialGoal[]>(MOCK_FINANCIAL_GOALS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<FinancialGoal | Partial<FinancialGoal> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

    const handleOpenAddModal = () => {
        setEditingGoal({ name: "", targetAmount: 0, currentAmount: 0, targetDate: "" });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (goal: FinancialGoal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (goal: FinancialGoal) => {
        setGoalToDelete(goal);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setEditingGoal(null);
        setIsDeleteModalOpen(false);
        setGoalToDelete(null);
        setIsSuggestionModalOpen(false);
    };

    const handleSaveGoal = () => {
        if (!editingGoal) return;

        if (!editingGoal.name || !editingGoal.targetAmount || editingGoal.targetAmount <= 0) {
            return;
        }

        if ("id" in editingGoal) {
            setGoals(
                goals.map((g) => (g.$id === (editingGoal as FinancialGoal).$id ? (editingGoal as FinancialGoal) : g))
            );
        } else {
            const newGoal: FinancialGoal = {
                $id: `goal-${Date.now()}`,
                name: editingGoal.name,
                targetAmount: editingGoal.targetAmount || 0,
                currentAmount: editingGoal.currentAmount || 0,
                targetDate: editingGoal.targetDate || "",
            };
            setGoals([...goals, newGoal]);
        }
        handleCloseModals();
    };

    const handleConfirmDelete = () => {
        if (!goalToDelete) return;
        setGoals(goals.filter((g) => g.$id !== goalToDelete.$id));
        handleCloseModals();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setEditingGoal((prev) =>
            prev ? { ...prev, [name]: type === "number" ? parseFloat(value) || 0 : value } : null
        );
    };

    const handleGenerateGoals = async () => {
        setIsGenerating(true);
        const netMonthly = MOCK_MONTHLY_INCOME + MOCK_MONTHLY_EXPENSES;
        const prompt = `
            Você é um consultor financeiro especialista. Com base nos dados financeiros de um usuário, sugira 3 metas financeiras realistas e personalizadas.

            Dados do Usuário:
            - Saldo Total em Contas: ${formatCurrency(MOCK_BALANCE)}
            - Renda Mensal: ${formatCurrency(MOCK_MONTHLY_INCOME)}
            - Despesas Mensais: ${formatCurrency(Math.abs(MOCK_MONTHLY_EXPENSES))}
            - Saldo Mensal (Renda - Despesas): ${formatCurrency(netMonthly)}
            - Meta de Aposentadoria Atual: Atingir ${formatCurrency(MOCK_RETIREMENT_GOAL.targetSavings)} aos ${
            MOCK_RETIREMENT_GOAL.targetAge
        } anos.
            - Metas existentes: ${goals.map((g) => g.name).join(", ") || "Nenhuma"}
            - Últimas transações (para entender hábitos): ${MOCK_TRANSACTIONS.slice(0, 5)
                .map((t) => `${t.description}: ${formatCurrency(t.amount)}`)
                .join("; ")}

            Instruções:
            1. Analise todos os dados para entender a situação financeira do usuário.
            2. Proponha 3 metas que sejam alcançáveis e relevantes. Ex: "Criar uma Reserva de Emergência", "Pagar dívidas de cartão de crédito", "Viagem de Férias", "Entrada para um imóvel".
            3. Para cada meta, forneça um nome claro ('name'), um valor alvo ('targetAmount'), uma data alvo ('targetDate') e uma breve justificativa ('justification') explicando por que essa meta é importante para o usuário.
            4. Não sugira metas que o usuário já possui.
            5. O valor alvo deve ser realista com base no saldo mensal do usuário.
            6. A resposta DEVE ser um array JSON válido, nada mais.
        `;

        try {
            // TODO: Move this to a server-side API route to protect the API key
            // For now, this feature is disabled until proper server-side implementation
            throw new Error('AI goal generation is temporarily disabled. Please use the manual goal creation.');
            
            /* const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                targetAmount: { type: Type.NUMBER },
                                targetDate: { type: Type.STRING },
                                justification: { type: Type.STRING },
                            },
                            required: ["name", "targetAmount", "targetDate", "justification"],
                        },
                    },
                },
            }); */
            // const suggested = JSON.parse(response.text ?? '[]');
            // setSuggestedGoals(suggested);
            // setIsSuggestionModalOpen(true);
        } catch (error) {
            console.error("Error generating AI goals:", error);
            alert('A geração de metas com IA está temporariamente desabilitada. Por favor, crie metas manualmente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddSuggestedGoal = (goalToAdd: SuggestedGoal) => {
        const newGoal: FinancialGoal = {
            $id: `goal-${Date.now()}`,
            name: goalToAdd.name,
            targetAmount: goalToAdd.targetAmount,
            currentAmount: 0,
            targetDate: goalToAdd.targetDate,
        };
        setGoals((prev) => [...prev, newGoal]);
        setSuggestedGoals((prev) => prev.filter((g) => g.name !== goalToAdd.name));
    };

    return (
        <>
            <div className="p-4 md:p-8">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-normal text-on-surface">Metas Financeiras</h1>
                        <p className="text-base text-on-surface-variant">
                            Acompanhe seu progresso em direção aos seus maiores sonhos.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            leftIcon={<SparklesIcon className="w-5 h-5" />}
                            onClick={handleGenerateGoals}
                            disabled={isGenerating}
                        >
                            {isGenerating ? "Gerando..." : "Gerar com IA"}
                        </Button>
                        <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={handleOpenAddModal}>
                            Adicionar Nova Meta
                        </Button>
                    </div>
                </header>

                <div className="mb-8">
                    <RetirementGoalCard />
                </div>

                <main>
                    {goals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {goals.map((goal) => (
                                <FinancialGoalCard
                                    key={goal.$id}
                                    goal={goal}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleOpenDeleteModal}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 mt-4 text-center flex flex-col items-center">
                            <div className="p-3 bg-primary-container rounded-full mb-4">
                                <TargetIcon className="w-8 h-8 text-on-primary-container" />
                            </div>
                            <h3 className="text-xl font-medium text-on-surface">Nenhuma Meta Financeira Ainda</h3>
                            <p className="text-on-surface-variant mt-1 mb-6 max-w-sm">
                                Crie sua primeira meta para começar a acompanhar seu progresso em alcançá-la.
                            </p>
                            <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={handleOpenAddModal}>
                                Adicionar Nova Meta
                            </Button>
                        </Card>
                    )}
                </main>
            </div>

            {/* AI Suggestions Modal */}
            <Modal isOpen={isSuggestionModalOpen} onClose={handleCloseModals} title="Sugestões de Metas com IA">
                <div className="p-6">
                    {suggestedGoals.length > 0 ? (
                        <div className="space-y-4">
                            {suggestedGoals.map((goal, index) => (
                                <Card key={index} className="p-4 bg-surface">
                                    <h4 className="font-medium text-lg text-on-surface">{goal.name}</h4>
                                    <p className="text-sm text-on-surface-variant mt-1">
                                        Alvo: <strong>{formatCurrency(goal.targetAmount)}</strong> até{" "}
                                        <strong>{goal.targetDate}</strong>
                                    </p>
                                    <p className="text-xs text-on-surface-variant mt-2 p-2 bg-surface-variant/20 rounded-md">
                                        <strong>Justificativa:</strong> {goal.justification}
                                    </p>
                                    <div className="text-right mt-3">
                                        <Button onClick={() => handleAddSuggestedGoal(goal)}>Adicionar Meta</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-on-surface-variant text-center py-4">Todas as sugestões foram adicionadas!</p>
                    )}
                    <div className="flex justify-end mt-6">
                        <Button variant="outline" onClick={handleCloseModals}>
                            Fechar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add/Edit Modal */}
            {editingGoal && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    title={"id" in editingGoal ? "Editar Meta Financeira" : "Adicionar Nova Meta Financeira"}
                >
                    <div className="p-6">
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveGoal();
                            }}
                        >
                            <Input
                                id="name"
                                name="name"
                                label="Nome da Meta"
                                placeholder="Ex: Viagem para Europa"
                                value={editingGoal.name || ""}
                                onChange={handleInputChange}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    id="currentAmount"
                                    name="currentAmount"
                                    label="Valor Atual"
                                    type="number"
                                    value={editingGoal.currentAmount || ""}
                                    onChange={handleInputChange}
                                />
                                <Input
                                    id="targetAmount"
                                    name="targetAmount"
                                    label="Valor Alvo"
                                    type="number"
                                    value={editingGoal.targetAmount || ""}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <Input
                                id="targetDate"
                                name="targetDate"
                                label="Data Alvo"
                                placeholder="Ex: Junho 2025"
                                value={editingGoal.targetDate || ""}
                                onChange={handleInputChange}
                            />
                        </form>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={handleCloseModals}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveGoal}>Salvar Meta</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {goalToDelete && (
                <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Confirmar Exclusão de Meta">
                    <div className="p-6">
                        <p className="text-on-surface-variant mb-6">
                            Tem certeza que deseja excluir a meta "{goalToDelete.name}"? Esta ação não pode ser
                            desfeita.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={handleCloseModals}>
                                Cancelar
                            </Button>
                            <Button className="bg-error hover:opacity-90" onClick={handleConfirmDelete}>
                                Excluir
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
