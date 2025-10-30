'use client';

import React, { useState, useRef, useEffect } from "react";

interface DropdownMenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
}

interface DropdownMenuItemProps {
    onClick: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: "default" | "danger";
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={menuRef}>
            <div onClick={handleToggle}>{trigger}</div>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="py-1">{children}</div>
                </div>
            )}
        </div>
    );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
    onClick, 
    children, 
    icon, 
    variant = "default" 
}) => {
    const textColor = variant === "danger" ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-100";
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };
    
    return (
        <button
            onClick={handleClick}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${textColor}`}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
};
