'use client';

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/assets/Icons";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'large';
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size, maxWidth = 'md' }) => {
    // Support both 'size' and 'maxWidth' props for backwards compatibility
    const effectiveSize = size || maxWidth;
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        large: 'max-w-4xl',
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className={`bg-surface-new-primary w-full ${maxWidthClasses[effectiveSize]} rounded-lg shadow-soft-xl transform transition-smooth-200 animate-slide-up`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-6 border-b border-border-primary">
                    <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors-smooth focus-ring"
                        aria-label="Close modal"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <div>{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
