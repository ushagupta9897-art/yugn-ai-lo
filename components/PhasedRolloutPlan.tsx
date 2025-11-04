
import React, { useState } from 'react';
import type { Phase } from '../types';
import Card from './Card';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { CheckIcon } from './icons/CheckIcon';

interface PhasedRolloutPlanProps {
    plan: Phase[];
}

const categoryStyles = {
    Setup: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    Campaign: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    Content: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    Analysis: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    SEO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
};

const PhasedRolloutPlan: React.FC<PhasedRolloutPlanProps> = ({ plan }) => {
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);

    if (!plan || plan.length === 0) return null;

    const activePhase = plan[activePhaseIndex];

    return (
        <div>
            <h2 className="text-3xl font-bold font-heading">🗓️ 90-Day Rollout Plan</h2>
            <Card className="mt-4">
                 <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <CalendarDaysIcon className="w-9 h-9" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold font-heading">Your Actionable Timeline</h3>
                        <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-1">
                            Follow this phased plan to implement your strategy effectively, from foundational setup to scaling your campaigns.
                        </p>
                    </div>
                </div>

                <div className="mt-6 border-b border-border-light dark:border-border-dark">
                    <nav className="-mb-px flex space-x-2 pb-1 overflow-x-auto" aria-label="Tabs">
                        {plan.map((phase, index) => (
                            <button
                                key={phase.title}
                                onClick={() => setActivePhaseIndex(index)}
                                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activePhaseIndex === index ? 'bg-surface-light dark:bg-surface-dark text-primary' : 'bg-transparent text-secondary-text-light dark:text-secondary-text-dark hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                {phase.title.split('(')[0].trim()}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="bg-slate-50 dark:bg-surface-dark/50 p-6 rounded-b-lg min-h-[200px]">
                    {activePhase && (
                        <div className="animate-fade-in">
                            <h4 className="font-bold text-lg">{activePhase.title}</h4>
                            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark italic mt-1">{activePhase.focus}</p>
                            <ul className="mt-4 space-y-3">
                                {(activePhase.actionItems || []).map((action, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm">{action.item}</p>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${categoryStyles[action.category]}`}>
                                                {action.category}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default PhasedRolloutPlan;
