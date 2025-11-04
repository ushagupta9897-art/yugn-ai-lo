
import React from 'react';
import type { FinancialForecast } from '../types';
import Card from './Card';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

interface FinancialForecastCardProps {
    forecast: FinancialForecast;
}

const FinancialForecastCard: React.FC<FinancialForecastCardProps> = ({ forecast }) => {
    if (!forecast) return null;

    return (
        <div>
            <h2 className="text-3xl font-bold font-heading">💰 Financial Forecast</h2>
            <Card className="mt-4">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-success/30">
                        <TrendingUpIcon className="w-9 h-9" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark italic">{forecast.summary}</p>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(forecast.channelForecasts || []).map(channel => (
                        <div key={channel.platformName} className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                            <h4 className="font-bold text-primary">{channel.platformName}</h4>
                            <p className="text-xs font-semibold text-secondary-text-light dark:text-secondary-text-dark mb-2">Projected Spend: {channel.projectedSpend}</p>
                            <ul className="space-y-1.5 text-sm">
                                {(channel.projectedKpis || []).map(kpi => (
                                    <li key={kpi.metric} className="flex justify-between items-center bg-surface-light dark:bg-surface-dark px-2 py-1 rounded-md">
                                        <span>{kpi.metric}:</span>
                                        <span className="font-bold">{kpi.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                    <p className="text-xs text-subtle-text-light dark:text-subtle-text-dark text-center">
                        <strong>Disclaimer:</strong> {forecast.disclaimer}
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default FinancialForecastCard;
