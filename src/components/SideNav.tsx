import React from 'react';
import type { Tab } from '../types';
import { Tab as TabEnum } from '../types';
import { useAppContext } from '../contexts/AppContext';

import { StrategyIcon, AssetsIcon, CampaignIcon, ContentIcon, AdvisorIcon, SeoIcon, PlannerIcon } from './icons/TabIcons';
import { AppIcon } from './icons/AppIcon';
import ThemeToggle from './ThemeToggle';
import { PlugIcon } from './icons/PlugIcon';
import ProjectSwitcher from './ProjectSwitcher';
import { DashboardIcon } from './icons/DashboardIcon';
import { FlaskIcon } from './icons/FlaskIcon';

interface SideNavProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const NavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    tourId?: string;
    isSoon?: boolean;
}> = ({ label, icon, isActive, onClick, tourId, isSoon }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg text-sm font-semibold transition-all duration-200 group relative ${
                isActive 
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary dark:text-white shadow-sm' 
                    : 'text-secondary-text-light dark:text-secondary-text-dark hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label={label}
            data-tour-id={tourId}
        >
            <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200 ${isActive ? 'bg-primary' : 'bg-transparent -translate-x-1 group-hover:translate-x-0 group-hover:bg-primary/50'}`}></span>
            <span className="flex-shrink-0 w-6 h-6">{icon}</span>
            <span className="hidden lg:block flex-1 text-left">{label}</span>
            {isSoon && <span className="hidden lg:inline-block text-xs font-bold bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-0.5 rounded-full">Soon</span>}
            <div className="absolute left-full rounded-md px-2 py-1 ml-4 bg-surface-dark text-primary-text-dark text-sm
            invisible opacity-20 -translate-x-3 transition-all
            lg:hidden group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                {label}
            </div>
        </button>
    );
};

const SideNav: React.FC<SideNavProps> = ({ activeTab, setActiveTab }) => {
    const { openIntegrationsModal, user, logout } = useAppContext();

    const navItems = [
        { id: TabEnum.Dashboard, label: "Dashboard", icon: <DashboardIcon />, tourId: 'nav-dashboard' },
        { id: TabEnum.Strategy, label: "Strategy", icon: <StrategyIcon />, tourId: 'nav-strategy' },
        { id: TabEnum.Lab, label: "Resonance Lab", icon: <FlaskIcon />, tourId: 'nav-lab' },
        { id: TabEnum.Planner, label: "Planner", icon: <PlannerIcon />, tourId: 'nav-planner' },
        { id: TabEnum.Assets, label: "Assets", icon: <AssetsIcon />, tourId: 'nav-assets', soon: true },
        { id: TabEnum.Campaigns, label: "Campaigns", icon: <CampaignIcon />, tourId: 'nav-campaigns', soon: true },
        { id: TabEnum.Content, label: "Content", icon: <ContentIcon />, tourId: 'nav-content' },
        { id: TabEnum.Seo, label: "SEO", icon: <SeoIcon />, tourId: 'nav-seo', soon: true },
        { id: TabEnum.Advisor, label: "Yugn AI Advisor", icon: <AdvisorIcon />, tourId: 'nav-advisor' },
    ];

    return (
        <nav className="w-20 lg:w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col p-4 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                    <AppIcon className="w-6 h-6 text-white"/>
                </div>
                <h1 className="hidden lg:block text-xl font-bold font-heading">Yugn AI Hub</h1>
            </div>

            <div className="mb-6 lg:px-0">
                <ProjectSwitcher />
            </div>

            <div className="flex-1 space-y-2">
                {navItems.map(item => (
                    <NavButton
                        key={item.id}
                        label={item.label}
                        icon={item.icon}
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        tourId={item.tourId}
                        isSoon={item.soon}
                    />
                ))}
            </div>

            <div className="space-y-2 border-t border-border-light dark:border-border-dark pt-4">
                 <button
                    onClick={openIntegrationsModal}
                    className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg text-sm font-semibold transition-colors text-secondary-text-light dark:text-secondary-text-dark hover:bg-slate-100 dark:hover:bg-slate-800 group relative"
                    aria-label="Connect Platforms"
                >
                    <PlugIcon className="w-6 h-6 flex-shrink-0" />
                    <span className="hidden lg:block">Integrations</span>
                     <div className="absolute left-full rounded-md px-2 py-1 ml-4 bg-surface-dark text-primary-text-dark text-sm
                        invisible opacity-20 -translate-x-3 transition-all
                        lg:hidden group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                        Integrations
                    </div>
                </button>
                <div className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg text-sm font-semibold transition-colors text-secondary-text-light dark:text-secondary-text-dark">
                    <ThemeToggle />
                    <span className="hidden lg:block">Theme</span>
                </div>
                {user && (
                    <div className="border-t border-border-light dark:border-border-dark pt-2">
                         <div className="flex items-center gap-3 p-2">
                            <img src={user.picture} alt="User avatar" className="w-10 h-10 rounded-full" />
                            <div className="hidden lg:block">
                                <p className="font-semibold text-sm">{user.name}</p>
                                <button onClick={logout} className="text-xs text-subtle-text-light dark:text-subtle-text-dark hover:underline">Logout</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default SideNav;
