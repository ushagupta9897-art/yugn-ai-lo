import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Tab } from '../types';
import Card from '../components/Card';
import BudgetDoughnutChart from '../components/charts/BudgetDoughnutChart';
import { PersonaCard } from '../components/PersonaCard';
import { DashboardIcon } from '../components/icons/DashboardIcon';

const CampaignProgress: React.FC = () => {
    const { getActiveProject } = useAppContext();
    const calendar = getActiveProject()?.calendar || [];

    if (calendar.length === 0) {
        return null;
    }

    const totalTasks = calendar.length;
    const completedTasks = calendar.filter(item => item.status === 'Done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <Card>
            <h2 className="text-xl font-bold font-heading mb-4">🗓️ Campaign Progress</h2>
            <div className="text-center">
                <p className="text-4xl font-bold font-heading text-primary">{progress}%</p>
                <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1">
                    {completedTasks} of {totalTasks} tasks completed
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-4">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                </div>
            </div>
        </Card>
    );
};

const Dashboard: React.FC = () => {
    const { getActiveProject, setActiveTab } = useAppContext();
    const activeProject = getActiveProject();
    const strategy = activeProject?.strategy;

    if (!strategy) {
        return (
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                 <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                        <DashboardIcon className="w-12 h-12 text-white"/>
                    </div>
                    <h3 className="text-2xl font-bold font-heading">Welcome to your Project Dashboard</h3>
                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">
                        This is where your marketing strategy will be visualized. Generate a strategy first to see it here.
                    </p>
                    <button 
                        onClick={() => setActiveTab(Tab.Strategy)}
                        className="mt-6 text-white font-bold py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
                    >
                        Go to Strategy Builder
                    </button>
                </div>
            </div>
        );
    }

    const { budgetStrategy, contentStrategy, targetPersonas } = strategy;
    const hasCalendar = activeProject?.calendar && activeProject.calendar.length > 0;


    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                <h1 className="text-3xl font-bold font-heading">Project Dashboard: {activeProject?.name}</h1>

                {hasCalendar && <CampaignProgress />}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <Card className="lg:col-span-3">
                        <h2 className="text-xl font-bold font-heading mb-4">💰 Budget Allocation</h2>
                        <div className="h-80">
                           {budgetStrategy?.platformSplits && <BudgetDoughnutChart splits={budgetStrategy.platformSplits} />}
                        </div>
                    </Card>
                    <Card className="lg:col-span-2">
                        <h2 className="text-xl font-bold font-heading mb-4">🗓️ Content Cadence</h2>
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">Frequency</p>
                                <p className="text-2xl font-bold font-heading text-primary">{contentStrategy?.frequency}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">Content Pillars</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(contentStrategy?.pillars || []).map(pillar => <span key={pillar} className="text-sm bg-slate-200 dark:bg-slate-700 rounded-full px-3 py-1">{pillar}</span>)}
                                </div>
                            </div>
                             <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">Formats</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(contentStrategy?.formats || []).map(format => <span key={format} className="text-sm bg-secondary/10 text-secondary-dark font-medium rounded-full px-3 py-1">{format}</span>)}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-heading mb-4">🎯 Target Personas</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(targetPersonas || []).map(persona => <PersonaCard key={persona.name} persona={persona} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;