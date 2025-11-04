import React from 'react';
import { ChevronRightIcon } from './icons/ChevronIcons';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
    title: string;
    subtitle: string;
    showConfigSidebarToggle?: boolean;
    isConfigSidebarOpen?: boolean;
    onConfigSidebarToggle?: () => void;
    onMobileNavToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, showConfigSidebarToggle, isConfigSidebarOpen, onConfigSidebarToggle, onMobileNavToggle }) => {
    return (
        <header className="flex-shrink-0 p-4 sm:p-6 lg:p-8 bg-surface-light/80 dark:bg-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark flex items-center z-10">
            <div className="flex items-center gap-4">
                {onMobileNavToggle && (
                    <button onClick={onMobileNavToggle} className="lg:hidden p-2 -ml-2 text-secondary-text-light dark:text-secondary-text-dark" aria-label="Open navigation">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                )}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-heading">{title}</h1>
                    <p className="text-sm sm:text-base text-secondary-text-light dark:text-secondary-text-dark mt-1">{subtitle}</p>
                </div>
            </div>
            {showConfigSidebarToggle && (
                <button
                    onClick={onConfigSidebarToggle}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    aria-label={isConfigSidebarOpen ? "Hide configuration" : "Show configuration"}
                >
                    <ChevronRightIcon className={`w-6 h-6 transition-transform duration-300 text-secondary-text-light dark:text-secondary-text-dark ${isConfigSidebarOpen ? 'rotate-180' : ''}`} />
                </button>
            )}
        </header>
    );
};

export default Header;