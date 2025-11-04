import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { Tab } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { FlaskIcon } from '../components/icons/FlaskIcon';
import { runResonanceTest, generateCreativeVariations } from '../services/geminiService';
import type { AdCreativeVariation, PersonaFeedback } from '../types';
import { CheckIcon } from '../components/icons/CheckIcon';
import { MarkdownContent } from '../components/Chat/MarkdownContent';
import ScoreDonut from '../components/charts/ScoreDonut';
import Input from '../components/Input';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { PaperPlaneIcon } from '../components/icons/PaperPlaneIcon';
import ResonanceChart from '../components/charts/ResonanceChart';

const ProgressTracker: React.FC<{ stages: { stage: string; status: string }[] }> = ({ stages }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return <Spinner size="small" className="w-5 h-5 text-primary" />;
            case 'complete': return <CheckIcon className="w-5 h-5 text-success" />;
            default: return <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />;
        }
    };

    return (
        <div className="mt-8 p-6 bg-slate-50 dark:bg-surface-dark/60 rounded-xl border border-border-light dark:border-border-dark max-w-lg mx-auto">
            <div className="space-y-4">
                {stages.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                        <p className={`text-base ${item.status === 'running' ? 'text-primary dark:text-blue-300 font-semibold' : 'text-secondary-text-light dark:text-secondary-text-dark'}`}>{item.stage}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CreativeCard: React.FC<{
    creative: AdCreativeVariation;
    feedback: PersonaFeedback[];
    isWinner: boolean;
    onGenerateVariations: () => void;
    onSendToContent: () => void;
}> = ({ creative, feedback, isWinner, onGenerateVariations, onSendToContent }) => (
    <Card className={`flex flex-col ${isWinner ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10' : ''}`}>
        {isWinner && (
            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                🏆 Winning Creative
            </div>
        )}
        <h3 className="font-bold text-lg font-heading">{creative.theme}</h3>
        <div className="mt-4 p-4 bg-slate-50 dark:bg-surface-dark/60 rounded-lg">
            <p className="font-semibold text-primary">{creative.headline}</p>
            <p className="mt-2 text-sm text-secondary-text-light dark:text-secondary-text-dark">{creative.body}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark space-y-3">
            <h4 className="font-semibold text-sm">Persona Feedback</h4>
            {feedback.map(f => (
                <div key={f.personaName} className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg flex gap-4">
                    <div className="flex-shrink-0">
                        <ScoreDonut score={f.resonanceScore * 10} size="small" />
                    </div>
                    <div>
                        <p className="font-bold text-xs">{f.personaName}</p>
                        <p className="text-xs italic text-secondary-text-light dark:text-secondary-text-dark mt-1">"{f.feedback}"</p>
                    </div>
                </div>
            ))}
        </div>
        {isWinner && (
             <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={onGenerateVariations} disabled={creative.isGeneratingVariations} className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 rounded-lg border-2 border-secondary text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-50 disabled:cursor-wait">
                        {creative.isGeneratingVariations ? <><Spinner size="small"/> Generating...</> : <><SparklesIcon className="w-4 h-4" /> Create Variations</>}
                    </button>
                    <button onClick={onSendToContent} className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors">
                        <PaperPlaneIcon className="w-4 h-4" /> Send to Content
                    </button>
                </div>
                {creative.variations && creative.variations.length > 0 && (
                     <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg animate-fade-in">
                        <h5 className="font-semibold text-sm mb-2">New Variations:</h5>
                        <div className="space-y-2">
                            {creative.variations.map((v, i) => (
                                <div key={i} className="text-xs p-2 bg-surface-light dark:bg-surface-dark rounded-md prose prose-sm dark:prose-invert max-w-full">
                                    <MarkdownContent content={v} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
    </Card>
);

const ResonanceLab: React.FC = () => {
    const { getActiveProject, updateActiveProjectData, setActiveTab, setContentGeneratorPrefill } = useAppContext();
    const { addToast } = useToast();
    
    const activeProject = getActiveProject();
    const strategy = activeProject?.strategy;
    const report = activeProject?.resonanceReport;

    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<{stage: string; status: string}[]>([]);
    const [coreMessage, setCoreMessage] = useState('');

    const handleStartTest = async () => {
        if (!strategy?.targetPersonas || strategy.targetPersonas.length === 0 || !activeProject?.businessData) {
            addToast("A strategy with defined personas is required to run the Resonance Lab.", 'error');
            return;
        }

        setIsLoading(true);
        setProgress([]);
        updateActiveProjectData({ resonanceReport: null });

        try {
            const orchestrator = runResonanceTest(activeProject.businessData, strategy.targetPersonas, coreMessage);
            for await (const update of orchestrator) {
                setProgress(prev => {
                    const stageRoot = update.stage.split('...')[0];
                    const existingIndex = prev.findIndex(p => p.stage.startsWith(stageRoot));

                    if (existingIndex > -1) {
                        const newProgress = [...prev];
                        newProgress[existingIndex] = { stage: update.stage, status: update.status };
                        return newProgress;
                    }
                    
                    const completedStages = prev.map(p => ({...p, status: 'complete' as const }));
                    return [...completedStages, { stage: update.stage, status: update.status }];
                });
                
                if (update.result) {
                    updateActiveProjectData({ resonanceReport: update.result });
                    addToast("Resonance Test complete!", 'success');
                }
            }
        } catch (err) {
            addToast(err instanceof Error ? err.message : "An unknown error occurred during the test.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVariations = async (creativeId: string) => {
        const currentReport = getActiveProject()?.resonanceReport;
        if (!currentReport) return;
    
        const updatedCreatives = currentReport.generatedCreatives.map(c => 
            c.id === creativeId ? { ...c, isGeneratingVariations: true, variations: undefined } : c
        );
        updateActiveProjectData({ resonanceReport: { ...currentReport, generatedCreatives: updatedCreatives } });
    
        try {
            const creativeToVary = currentReport.generatedCreatives.find(c => c.id === creativeId);
            if (!creativeToVary) throw new Error("Creative not found");
    
            const variations = await generateCreativeVariations(creativeToVary);
    
            const latestReport = getActiveProject()?.resonanceReport;
            if (!latestReport) return;
            const finalCreatives = latestReport.generatedCreatives.map(c => 
                c.id === creativeId ? { ...c, isGeneratingVariations: false, variations } : c
            );
            updateActiveProjectData({ resonanceReport: { ...latestReport, generatedCreatives: finalCreatives } });
            
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to generate variations.", 'error');
            const latestReport = getActiveProject()?.resonanceReport;
             if (!latestReport) return;
            const finalCreatives = latestReport.generatedCreatives.map(c => 
                c.id === creativeId ? { ...c, isGeneratingVariations: false } : c
            );
            updateActiveProjectData({ resonanceReport: { ...latestReport, generatedCreatives: finalCreatives } });
        }
    };

    const handleSendToContent = (creative: AdCreativeVariation) => {
        setContentGeneratorPrefill({
            platform: 'meta', // Default, can be changed by user
            type: 'ad-creative',
            topic: `${creative.headline}\n\n${creative.body}`,
            tone: '',
            keywords: '',
        });
        setActiveTab(Tab.Content);
        addToast("Content Generator pre-filled with winning creative!", 'info');
    };

    const renderContent = () => {
        if (!strategy || !strategy.targetPersonas || strategy.targetPersonas.length === 0) {
             return (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                        <FlaskIcon className="w-12 h-12 text-white"/>
                    </div>
                    <h3 className="text-2xl font-bold font-heading">First, Create a Strategy</h3>
                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">
                        The AI Resonance Lab needs defined target personas to simulate feedback. Please generate a marketing plan in the Strategy Builder first.
                    </p>
                    <button 
                        onClick={() => setActiveTab(Tab.Strategy)}
                        className="mt-6 text-white font-bold py-3 px-6 rounded-xl bg-primary hover:bg-primary-hover hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
                    >
                        Go to Strategy Builder
                    </button>
                </div>
            );
        }

        if (isLoading) {
            return (
                 <div className="text-center">
                    <h2 className="text-3xl font-bold font-heading">Running Resonance Test...</h2>
                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-2xl mx-auto">Niti AI is simulating a focus group with your target personas. This may take a moment.</p>
                    <ProgressTracker stages={progress} />
                </div>
            );
        }
        
        if (report) {
            return (
                <div className="space-y-8 animate-fade-in-up">
                    <Card>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <h2 className="text-2xl font-bold font-heading">Resonance Test Report</h2>
                            <button 
                                onClick={handleStartTest} 
                                disabled={isLoading}
                                className="w-full sm:w-auto text-white font-bold py-2 px-5 rounded-xl bg-primary hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 disabled:opacity-50"
                            >
                                🔄 Run Test Again
                            </button>
                        </div>
                    </Card>
                    
                    {report && <ResonanceChart report={report} />}

                    <Card className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30">
                        <h3 className="text-xl font-bold font-heading text-emerald-800 dark:text-emerald-200">Analysis Summary</h3>
                        <div className="mt-2 text-emerald-700 dark:text-emerald-300 prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownContent content={report.analysisSummary} />
                        </div>
                    </Card>
                    
                    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {report.generatedCreatives.map(creative => (
                            <CreativeCard 
                                key={creative.id}
                                creative={creative}
                                feedback={report.personaFeedback.filter(f => f.creativeId === creative.id)}
                                isWinner={creative.id === report.winningCreativeId}
                                onGenerateVariations={() => handleGenerateVariations(creative.id)}
                                onSendToContent={() => handleSendToContent(creative)}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                    <FlaskIcon className="w-12 h-12 text-white"/>
                </div>
                <h3 className="text-2xl font-bold font-heading">Welcome to the AI Resonance Lab</h3>
                <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-lg">
                   Test your ad creatives against a virtual focus group of AI-powered personas before you spend a single dollar on ads.
                </p>
                <div className="mt-6 w-full max-w-lg">
                    <Input 
                        id="coreMessage"
                        label="Core Message / CTA (Optional)"
                        value={coreMessage}
                        onChange={(_, val) => setCoreMessage(val)}
                        placeholder="e.g., 'Get 20% off our summer sale.'"
                    />
                </div>
                <button 
                    onClick={handleStartTest}
                    disabled={isLoading}
                    className="mt-6 text-white font-bold py-4 px-8 rounded-xl bg-primary hover:bg-primary-hover hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                    🚀 Start Resonance Test
                </button>
            </div>
        );
    };

    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default ResonanceLab;
