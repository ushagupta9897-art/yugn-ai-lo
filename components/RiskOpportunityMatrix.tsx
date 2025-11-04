
import React from 'react';
import type { RiskAnalysis } from '../types';
import Card from './Card';
import { ShieldExclamationIcon } from './icons/ShieldExclamationIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface RiskOpportunityMatrixProps {
    analysis: RiskAnalysis;
}

const tagClasses = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
};

const RiskOpportunityMatrix: React.FC<RiskOpportunityMatrixProps> = ({ analysis }) => {
    if (!analysis || (!analysis.risks?.length && !analysis.opportunities?.length)) {
        return null;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold font-heading">⚖️ Risks & Opportunities</h2>
            <Card className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Risks Column */}
                    <div>
                        <h3 className="text-xl font-bold font-heading flex items-center gap-3 text-red-600 dark:text-red-400">
                            <ShieldExclamationIcon className="w-6 h-6" />
                            Potential Risks
                        </h3>
                        <div className="mt-4 space-y-4">
                            {(analysis.risks || []).map((risk, index) => (
                                <div key={index} className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg border-l-4 border-red-500">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-semibold">Risk #{index + 1}</p>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${tagClasses[risk.impact]}`}>{risk.impact} Impact</span>
                                    </div>
                                    <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">{risk.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Opportunities Column */}
                    <div>
                        <h3 className="text-xl font-bold font-heading flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                            <LightbulbIcon className="w-6 h-6" />
                            Key Opportunities
                        </h3>
                        <div className="mt-4 space-y-4">
                            {(analysis.opportunities || []).map((opp, index) => (
                                <div key={index} className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg border-l-4 border-emerald-500">
                                    <div className="flex justify-between items-center mb-1">
                                         <p className="text-sm font-semibold">Opportunity #{index + 1}</p>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${tagClasses[opp.impact]}`}>{opp.impact} Impact</span>
                                    </div>
                                    <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">{opp.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RiskOpportunityMatrix;
