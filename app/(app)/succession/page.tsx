'use client';

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { MOCK_BENEFICIARIES } from "@/lib/constants";
import type { Beneficiary } from "@/lib/types";
import { UsersIcon, PlusIcon, EditIcon, Trash2Icon } from "@/components/assets/Icons";

const BeneficiaryRow: React.FC<{ beneficiary: Beneficiary; onEdit: () => void; onDelete: () => void }> = ({
    beneficiary,
    onEdit,
    onDelete,
}) => {
    const statusVariant = beneficiary.status === "Confirmed" ? "secondary" : "warning";
    return (
        <tr className="border-b border-outline last:border-b-0">
            <td className="p-4 font-medium text-on-surface">{beneficiary.name}</td>
            <td className="p-4 text-on-surface-variant">{beneficiary.relationship}</td>
            <td className="p-4 text-on-surface-variant">{beneficiary.allocation}</td>
            <td className="p-4">
                <Badge variant={statusVariant}>{beneficiary.status}</Badge>
            </td>
            <td className="p-4 text-right">
                <div className="inline-flex gap-2">
                    <Button variant="text" className="!p-2 !h-auto !rounded-full" onClick={onEdit}>
                        <EditIcon className="w-5 h-5 text-on-surface-variant" />
                    </Button>
                    <Button variant="text" className="!p-2 !h-auto !rounded-full" onClick={onDelete}>
                        <Trash2Icon className="w-5 h-5 text-error" />
                    </Button>
                </div>
            </td>
        </tr>
    );
};

export default function SuccessionPage() {
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(MOCK_BENEFICIARIES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | Partial<Beneficiary> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<Beneficiary | null>(null);

    const handleOpenAddModal = () => {
        setEditingBeneficiary({ name: "", relationship: "", allocation: "", status: "Pending" });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (beneficiary: Beneficiary) => {
        setEditingBeneficiary(beneficiary);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (beneficiary: Beneficiary) => {
        setBeneficiaryToDelete(beneficiary);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setEditingBeneficiary(null);
        setIsDeleteModalOpen(false);
        setBeneficiaryToDelete(null);
    };

    const handleSave = () => {
        if (!editingBeneficiary) return;

        if ("id" in editingBeneficiary) {
            setBeneficiaries(
                beneficiaries.map((b) =>
                    b.$id === (editingBeneficiary as Beneficiary).$id ? (editingBeneficiary as Beneficiary) : b
                )
            );
        } else {
            const newBeneficiary: Beneficiary = {
                $id: `beneficiary-${Date.now()}`,
                name: editingBeneficiary.name || "",
                relationship: editingBeneficiary.relationship || "",
                allocation: editingBeneficiary.allocation || "",
                status: "Pending",
            };
            setBeneficiaries([...beneficiaries, newBeneficiary]);
        }
        handleCloseModals();
    };

    const handleConfirmDelete = () => {
        if (beneficiaryToDelete) {
            setBeneficiaries(beneficiaries.filter((b) => b.$id !== beneficiaryToDelete.$id));
            handleCloseModals();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditingBeneficiary((prev) => (prev ? { ...prev, [name]: value } : null));
    };

    return (
        <>
            <div className="p-4 md:p-8">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-normal text-on-surface">Succession Planning</h1>
                        <p className="text-base text-on-surface-variant">
                            Manage your beneficiaries and ensure your assets are protected.
                        </p>
                    </div>
                    <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={handleOpenAddModal}>
                        Add Beneficiary
                    </Button>
                </header>
                <main>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-variant/20">
                                    <tr className="border-b border-outline">
                                        <th className="p-4 font-medium text-on-surface-variant">Name</th>
                                        <th className="p-4 font-medium text-on-surface-variant">Relationship</th>
                                        <th className="p-4 font-medium text-on-surface-variant">Allocation</th>
                                        <th className="p-4 font-medium text-on-surface-variant">Status</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {beneficiaries.map((b) => (
                                        <BeneficiaryRow
                                            key={b.$id}
                                            beneficiary={b}
                                            onEdit={() => handleOpenEditModal(b)}
                                            onDelete={() => handleOpenDeleteModal(b)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </main>
            </div>

            {/* Add/Edit Modal */}
            {editingBeneficiary && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    title={"id" in editingBeneficiary ? "Edit Beneficiary" : "Add Beneficiary"}
                >
                    <div className="p-6">
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSave();
                            }}
                        >
                            <Input
                                name="name"
                                label="Full Name"
                                value={editingBeneficiary.name || ""}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                name="relationship"
                                label="Relationship"
                                value={editingBeneficiary.relationship || ""}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                name="allocation"
                                label="Asset Allocation"
                                placeholder="e.g., 50% of investments"
                                value={editingBeneficiary.allocation || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </form>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outlined" onClick={handleCloseModals}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {beneficiaryToDelete && (
                <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Confirm Deletion">
                    <div className="p-6">
                        <p className="text-on-surface-variant mb-6">
                            Are you sure you want to remove {beneficiaryToDelete.name} as a beneficiary? This action
                            cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outlined" onClick={handleCloseModals}>
                                Cancel
                            </Button>
                            <Button className="bg-error hover:opacity-90" onClick={handleConfirmDelete}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
