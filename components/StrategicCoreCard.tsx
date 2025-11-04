import React from 'react';
import type { StrategicCore } from '../types';
import Card from './Card';
import { CompassIcon } from './icons/CompassIcon';

interface StrategicCoreCardProps {
    strategicCore: StrategicCore;
}

const StrategicCoreCard: React.FC<StrategicCoreCardProps> = ({ strategicCore }) => {
    if (!strategicCore) return null;

    return (
        <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-primary/20">
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <CompassIcon className="w-12 h-12" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold font-heading">Your Strategic Core</h3>
                    <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-1">This is the North Star for your entire marketing plan. Every decision should align with this core strategy.</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg">
                            <h4 className="font-semibold text-sm">Brand Archetype</h4>
                            <p className="font-bold text-lg text-primary">{strategicCore.brandArchetype}</p>
                            <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark italic mt-1">{strategicCore.archetypeJustification}</p>
                        </div>
                         <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg">
                            <h4 className="font-semibold text-sm">Strategic Angle of Attack</h4>
                            <p className="text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark mt-1">{strategicCore.strategicAngle}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default StrategicCoreCard;
