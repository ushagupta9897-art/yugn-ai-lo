import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { BudgetSplit } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BudgetDoughnutChartProps {
  splits: BudgetSplit[];
}

const BudgetDoughnutChart: React.FC<BudgetDoughnutChartProps> = ({ splits }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const colors = ['#4f46e5', '#7c3aed', '#db2777', '#10b981', '#f59e0b']; // primary, secondary, accent, success, warning

    const data = {
        labels: splits.map(s => s.platformName),
        datasets: [
            {
                label: 'Budget %',
                data: splits.map(s => s.percentage),
                backgroundColor: colors.slice(0, splits.length),
                borderColor: isDarkMode ? '#131b2f' : '#ffffff', // surface-dark or surface-light
                borderWidth: 3,
                hoverOffset: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: isDarkMode ? '#f1f5f9' : '#0f172a', // primary-text-dark or primary-text-light
                    boxWidth: 20,
                    padding: 20,
                    font: {
                        size: 14,
                        family: "'Sora', sans-serif"
                    }
                },
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.parsed + '%';
                        }
                        return label;
                    }
                }
            }
        },
    };

    return <Doughnut data={data} options={options} />;
};

export default BudgetDoughnutChart;
