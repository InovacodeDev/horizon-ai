'use client';

import React from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { MOCK_INSURANCE_POLICIES } from "@/lib/constants";
import type { InsurancePolicy } from "@/lib/types";
import { PlusIcon, ShieldIcon, HomeIcon, CarIcon } from "@/components/assets/Icons";

const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const getPolicyIcon = (type: InsurancePolicy["type"]) => {
    switch (type) {
        case "Life":
            return <ShieldIcon className="w-8 h-8 text-on-primary-container" />;
        case "Home":
            return <HomeIcon className="w-8 h-8 text-on-primary-container" />;
        case "Auto":
            return <CarIcon className="w-8 h-8 text-on-primary-container" />;
        default:
            return <ShieldIcon className="w-8 h-8 text-on-primary-container" />;
    }
};

const PolicyCard: React.FC<{ policy: InsurancePolicy }> = ({ policy }) => {
    const { type, provider, coverage, premium, status } = policy;

    const statusVariant: Record<typeof status, "secondary" | "warning" | "error"> = {
        Active: "secondary",
        "Expiring Soon": "warning",
        Expired: "error",
    };

    return (
        <Card className="p-5">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-container rounded-full">{getPolicyIcon(type)}</div>
                    <div>
                        <h3 className="font-medium text-lg text-on-surface">{type} Insurance</h3>
                        <p className="text-sm text-on-surface-variant">{provider}</p>
                    </div>
                </div>
                <Badge variant={statusVariant[status]}>{status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center bg-surface-variant/20 p-3 rounded-m">
                <div>
                    <p className="text-xs text-on-surface-variant">COVERAGE</p>
                    <p className="font-medium text-on-surface">{formatCurrency(coverage)}</p>
                </div>
                <div>
                    <p className="text-xs text-on-surface-variant">MONTHLY PREMIUM</p>
                    <p className="font-medium text-on-surface">{formatCurrency(premium)}</p>
                </div>
            </div>
        </Card>
    );
};

export default function InsurancePage() {
    return (
        <div className="p-4 md:p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-normal text-on-surface">Insurance Policies</h1>
                    <p className="text-base text-on-surface-variant">
                        Manage your insurance coverage for peace of mind.
                    </p>
                </div>
                <Button leftIcon={<PlusIcon className="w-5 h-5" />}>Add New Policy</Button>
            </header>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {MOCK_INSURANCE_POLICIES.map((policy) => (
                    <PolicyCard key={policy.$id} policy={policy} />
                ))}
            </main>
        </div>
    );
}
