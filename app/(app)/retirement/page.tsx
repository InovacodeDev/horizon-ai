'use client';

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MOCK_RETIREMENT_GOAL } from "@/lib/constants";
import type { RetirementGoal } from "@/lib/types";
import { TrendingUpIcon, DollarSignIcon, CalendarIcon, TargetIcon } from "@/components/assets/Icons";

const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

export default function RetirementPage() {
    const [retirementData, setRetirementData] = useState(MOCK_RETIREMENT_GOAL);
    const [isEditing, setIsEditing] = useState(false);

    const progress = (retirementData.currentSavings / retirementData.targetSavings) * 100;
    const yearsToRetirement = retirementData.targetAge - 30; // Assuming current age is 30
    const monthsToRetirement = yearsToRetirement * 12;
    const remainingAmount = retirementData.targetSavings - retirementData.currentSavings;
    const requiredMonthlyContribution = remainingAmount / monthsToRetirement;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRetirementData((prev: RetirementGoal) => ({
            ...prev,
            [name]: name === "targetAge" ? parseInt(value) || 0 : parseFloat(value) || 0,
        }));
    };

    const handleSave = () => {
        setIsEditing(false);
    };

    return (
        <div className="p-4 md:p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-normal text-on-surface">Retirement Planning</h1>
                    <p className="text-base text-on-surface-variant">
                        Plan your retirement and track your progress towards financial freedom.
                    </p>
                </div>
                <Button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancel" : "Edit Plan"}
                </Button>
            </header>

            <main className="space-y-6">
                {/* Main Retirement Goal Card */}
                <Card className="p-6 bg-primary-container border-primary">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-surface rounded-full">
                            <TrendingUpIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-medium text-on-primary-container">Your Retirement Goal</h3>
                            <p className="text-sm text-on-primary-container/80">
                                On track to retire at age {retirementData.targetAge}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-on-primary-container font-medium">
                                {formatCurrency(retirementData.currentSavings)}
                            </span>
                            <span className="text-on-primary-container font-medium">
                                {formatCurrency(retirementData.targetSavings)}
                            </span>
                        </div>
                        <div className="w-full bg-primary/20 rounded-full h-4">
                            <div
                                className="bg-primary rounded-full h-4 transition-all duration-500"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-on-primary-container">{progress.toFixed(1)}% Complete</span>
                            <span className="text-sm text-on-primary-container">
                                {remainingAmount > 0 ? formatCurrency(remainingAmount) : "Goal Reached!"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-surface/50 p-4 rounded-lg">
                            <p className="text-xs text-on-primary-container/70 mb-1">CURRENT MONTHLY</p>
                            <p className="text-xl font-medium text-on-primary-container">
                                {formatCurrency(retirementData.monthlyContribution)}
                            </p>
                        </div>
                        <div className="bg-surface/50 p-4 rounded-lg">
                            <p className="text-xs text-on-primary-container/70 mb-1">REQUIRED MONTHLY</p>
                            <p className="text-xl font-medium text-on-primary-container">
                                {formatCurrency(requiredMonthlyContribution)}
                            </p>
                        </div>
                        <div className="bg-surface/50 p-4 rounded-lg">
                            <p className="text-xs text-on-primary-container/70 mb-1">YEARS TO RETIREMENT</p>
                            <p className="text-xl font-medium text-on-primary-container">{yearsToRetirement} years</p>
                        </div>
                    </div>
                </Card>

                {/* Edit Form */}
                {isEditing && (
                    <Card className="p-6">
                        <h3 className="text-xl font-medium text-on-surface mb-4">Adjust Your Retirement Plan</h3>
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSave();
                            }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    name="targetAge"
                                    label="Target Retirement Age"
                                    type="number"
                                    value={retirementData.targetAge}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    name="targetSavings"
                                    label="Target Savings Amount"
                                    type="number"
                                    value={retirementData.targetSavings}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    name="currentSavings"
                                    label="Current Savings"
                                    type="number"
                                    value={retirementData.currentSavings}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    name="monthlyContribution"
                                    label="Monthly Contribution"
                                    type="number"
                                    value={retirementData.monthlyContribution}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary-container rounded-full">
                                <DollarSignIcon className="w-6 h-6 text-on-primary-container" />
                            </div>
                            <h4 className="font-medium text-on-surface">Contribution Status</h4>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                            {retirementData.monthlyContribution >= requiredMonthlyContribution ? (
                                <span className="text-secondary font-medium">
                                    ✓ You're on track! Your current contributions are sufficient to reach your goal.
                                </span>
                            ) : (
                                <span className="text-warning font-medium">
                                    ⚠ Consider increasing your monthly contribution by{" "}
                                    {formatCurrency(requiredMonthlyContribution - retirementData.monthlyContribution)}{" "}
                                    to stay on track.
                                </span>
                            )}
                        </p>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary-container rounded-full">
                                <CalendarIcon className="w-6 h-6 text-on-primary-container" />
                            </div>
                            <h4 className="font-medium text-on-surface">Timeline</h4>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                            You have <strong>{yearsToRetirement} years</strong> ({monthsToRetirement} months) until
                            your target retirement age of {retirementData.targetAge}.
                        </p>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary-container rounded-full">
                                <TargetIcon className="w-6 h-6 text-on-primary-container" />
                            </div>
                            <h4 className="font-medium text-on-surface">Milestone</h4>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                            {progress >= 75 ? (
                                <span>🎉 Excellent progress! You've saved over 75% of your retirement goal.</span>
                            ) : progress >= 50 ? (
                                <span>👍 Great work! You're halfway to your retirement goal.</span>
                            ) : progress >= 25 ? (
                                <span>📈 Good start! Keep contributing regularly to reach your goal.</span>
                            ) : (
                                <span>🚀 Just getting started! Every contribution brings you closer to retirement.</span>
                            )}
                        </p>
                    </Card>
                </div>

                {/* Tips Card */}
                <Card className="p-6 bg-surface-variant/20">
                    <h3 className="text-xl font-medium text-on-surface mb-4">Retirement Planning Tips</h3>
                    <ul className="space-y-3 text-sm text-on-surface-variant">
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>
                                <strong>Start Early:</strong> The power of compound interest means that starting early
                                can significantly increase your retirement savings.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>
                                <strong>Diversify Investments:</strong> Don't put all your eggs in one basket. Spread
                                your retirement savings across different investment types.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>
                                <strong>Review Regularly:</strong> Review your retirement plan at least annually and
                                adjust contributions as your income changes.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>
                                <strong>Consider Inflation:</strong> Factor in inflation when planning your retirement
                                savings to maintain your purchasing power.
                            </span>
                        </li>
                    </ul>
                </Card>
            </main>
        </div>
    );
}
