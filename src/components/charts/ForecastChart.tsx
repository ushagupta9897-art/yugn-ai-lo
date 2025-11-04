import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { CampaignForecast, PredictedMetrics } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface ForecastChartProps {
  forecast: CampaignForecast;
}

const parseRange = (range: string): number => {
  if (!range) return 0;
  const cleaned = range.replace(/[%$x]/g, '').trim();
  const parts = cleaned.split('-').map(part => parseFloat(part.trim()));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return (parts[0] + parts[1]) / 2;
  return 0;
};

const metricConfigs = [
    { key: 'predictedCtr', label: 'Predicted CTR (%)', color: 'rgba(75, 192, 192, 0.6)', tooltipSuffix: '%' },
    { key: 'predictedCpc', label: 'Predicted CPC', color: 'rgba(255, 159, 64, 0.6)', tooltipPrefix: '$' },
    { key: 'predictedConversions', label: 'Predicted Conversions', color: 'rgba(54, 162, 235, 0.6)' },
    { key: 'predictedRoas', label: 'Predicted ROAS', color: 'rgba(153, 102, 255, 0.6)', tooltipSuffix: 'x' },
];

const ForecastChart: React.FC<ForecastChartProps> = ({ forecast }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const labels = forecast.predictedMetrics.map(m => m.platform);

    const getChartOptions = (title: string, tooltipPrefix = '', tooltipSuffix = '') => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: title,
                color: isDarkMode ? '#e2e8f0' : '#475569',
                font: {
                    size: 16,
                    weight: 'bold' as const,
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            const value = context.parsed.y;
                            label += `${tooltipPrefix}${value.toFixed(2)}${tooltipSuffix}`;
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' },
                grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
            },
            y: {
                beginAtZero: true,
                ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' },
                grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
            }
        }
    });

    const getChartData = (metricKey: keyof PredictedMetrics, color: string, label: string) => ({
        labels,
        datasets: [{
            label,
            data: forecast.predictedMetrics.map(m => parseRange(m[metricKey] as string)),
            backgroundColor: color,
            borderColor: color.replace('0.6', '1'),
            borderWidth: 1,
            borderRadius: 4,
        }],
    });
    
    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {metricConfigs.map(config => (
                <div key={config.key} className="h-64">
                    <Bar 
                        options={getChartOptions(config.label, config.tooltipPrefix, config.tooltipSuffix)} 
                        data={getChartData(config.key as keyof PredictedMetrics, config.color, config.label)} 
                    />
                </div>
            ))}
        </div>
    );
};

export default ForecastChart;
