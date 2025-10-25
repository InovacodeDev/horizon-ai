'use client';

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { AVAILABLE_CATEGORY_ICONS } from "@/lib/constants";
import type { Category } from "@/lib/types";

type IconComponent = React.FC<{ className?: string }>;

interface IconPickerProps {
    selectedIcon: IconComponent;
    onSelectIcon: (icon: IconComponent) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2">
                {AVAILABLE_CATEGORY_ICONS.map(({ component: Icon, name }) => {
                    const isSelected = selectedIcon === Icon;
                    return (
                        <button
                            key={name}
                            type="button"
                            onClick={() => onSelectIcon(Icon)}
                            className={`flex items-center justify-center p-2 rounded-lg border-2 transition-colors ${
                                isSelected
                                    ? "bg-primary-container border-primary"
                                    : "bg-surface-variant/30 border-transparent hover:border-outline"
                            }`}
                            aria-label={`Select ${name} icon`}
                        >
                            <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-on-surface-variant"}`} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onAddCategory: (name: string, icon: IconComponent) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (id: string) => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
    isOpen,
    onClose,
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
}) => {
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState<IconComponent>(AVAILABLE_CATEGORY_ICONS[0].component);

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            onAddCategory(newCategoryName.trim(), newCategoryIcon);
            setNewCategoryName("");
            setNewCategoryIcon(AVAILABLE_CATEGORY_ICONS[0].component);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory({ ...category });
        setDeleteConfirmId(null);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

    const handleSaveEdit = () => {
        if (editingCategory) {
            onUpdateCategory(editingCategory);
            setEditingCategory(null);
        }
    };

    const handleDelete = (id: string) => {
        onDeleteCategory(id);
        setDeleteConfirmId(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories">
            <div className="p-6">
                <form onSubmit={handleAddSubmit} className="space-y-4 pb-4 border-b border-outline mb-4">
                    <h3 className="text-lg font-medium text-on-surface">Add New Category</h3>
                    <Input
                        id="new-category-name"
                        label="Category Name"
                        placeholder="e.g., Subscriptions"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <IconPicker selectedIcon={newCategoryIcon} onSelectIcon={setNewCategoryIcon} />
                    <div className="text-right">
                        <Button type="submit" disabled={!newCategoryName.trim()}>
                            Add Category
                        </Button>
                    </div>
                </form>

                <div>
                    <h3 className="text-lg font-medium text-on-surface mb-2">Existing Categories</h3>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {categories.map((category) => {
                            const { icon: Icon } = category;
                            const isEditing = editingCategory?.$id === category.$id;
                            const isConfirmingDelete = deleteConfirmId === category.$id;

                            return (
                                <li key={category.$id} className="p-2 rounded-lg bg-surface-variant/20">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <Input
                                                id={`edit-cat-${category.$id}`}
                                                label="Category Name"
                                                value={editingCategory.name}
                                                onChange={(e) =>
                                                    setEditingCategory({ ...editingCategory, name: e.target.value })
                                                }
                                            />
                                            <IconPicker
                                                selectedIcon={editingCategory.icon}
                                                onSelectIcon={(icon) =>
                                                    setEditingCategory({ ...editingCategory, icon })
                                                }
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outlined" onClick={handleCancelEdit}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleSaveEdit}>Save</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-6 h-6 text-on-surface-variant" />
                                            <span className="flex-grow font-medium text-on-surface">
                                                {category.name}
                                            </span>
                                            {isConfirmingDelete ? (
                                                <>
                                                    <span className="text-sm text-error">Are you sure?</span>
                                                    <Button
                                                        variant="text"
                                                        className="!text-error !px-2 !h-auto !py-1"
                                                        onClick={() => handleDelete(category.$id)}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        variant="text"
                                                        className="!px-2 !h-auto !py-1"
                                                        onClick={() => setDeleteConfirmId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="text"
                                                        className="!px-2 !h-auto !py-1"
                                                        onClick={() => handleEdit(category)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="text"
                                                        className="!text-error !px-2 !h-auto !py-1"
                                                        onClick={() => setDeleteConfirmId(category.$id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default ManageCategoriesModal;
