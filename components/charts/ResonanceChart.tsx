import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ResonanceReport } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ResonanceChartProps {
  report: ResonanceReport;
}

const ResonanceChart: React.FC<ResonanceChartProps> = ({ report }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const averageScores = report.generatedCreatives.map(creative => {
        const relevantFeedback = report.personaFeedback.filter(f => f.creativeId === creative.id);
        const totalScore = relevantFeedback.reduce((sum, f) => sum + f.resonanceScore, 0);
        const average = relevantFeedback.length > 0 ? totalScore / relevantFeedback.length : 0;
        return {
            theme: creative.theme,
            averageScore: average,
        };
    });

    const labels = averageScores.map(s => s.theme);
    const scores = averageScores.map(s => s.averageScore);

    const data = {
        labels,
        datasets: [
            {
                label: 'Average Resonance Score',
                data: scores,
                backgroundColor: [
                    'rgba(79, 70, 229, 0.6)', // primary
                    'rgba(124, 58, 237, 0.6)', // secondary
                    'rgba(219, 39, 119, 0.6)', // accent
                ],
                borderColor: [
                     'rgba(79, 70, 229, 1)',
                    'rgba(124, 58, 237, 1)',
                    'rgba(219, 39, 119, 1)',
                ],
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Creative Performance Comparison',
                color: isDarkMode ? '#e2e8f0' : '#475569',
                font: {
                    size: 18,
                    weight: 'bold' as const,
                },
            },
             tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `Avg. Score: ${context.parsed.x.toFixed(1)} / 10`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 10,
                ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' },
                grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                title: {
                    display: true,
                    text: 'Average Resonance Score (1-10)',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                }
            },
            y: {
                ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' },
                grid: { display: false }
            }
        }
    };

    return (
        <Card>
            <div className="h-64">
                <Bar options={options} data={data} />
            </div>
        </Card>
    );
};

export default ResonanceChart;
