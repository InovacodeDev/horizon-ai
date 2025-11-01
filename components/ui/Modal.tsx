'use client';

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/assets/Icons";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'md' }) => {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-enter-active"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className={`bg-surface rounded-l w-full ${maxWidthClasses[maxWidth]} shadow-xl transform transition-all`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-outline">
                    <h2 id="modal-title" className="text-lg font-medium text-on-surface">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-on-surface-variant hover:bg-on-surface/10"
                        aria-label="Close modal"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <div>{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
