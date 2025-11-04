

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SeoAnalysisResult, GroundedResponse, ChatMessage as ChatMessageType, SeoAudit, TechnicalSeoAudit, ActionItem, Task, CompetitiveSummary, OnPageSeoDetails, BacklinkProfile, KeywordIntelligence, SeoCheckStatus, OnPageCheck, CoreWebVitalsCheck, SerpAnalysis } from '../types';
import { generateOrchestratedSeoAnalysis, getLatestGoogleUpdates, generateSeoCopySuggestion, performManualSeoAudit } from '../services/geminiService';
import { generateGroundedContent } from '../services/groundedModelService';
import { useToast } from '../contexts/ToastContext';
import { useAppContext } from '../contexts/AppContext';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Input from '../components/Input';
import ScoreDonut from '../components/charts/ScoreDonut';
import { MarkdownContent } from '../components/Chat/MarkdownContent';
import ChatMessage from '../components/Chat/ChatMessage';
import { SendIcon } from '../components/icons/SendIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { SeoIcon } from '../components/icons/TabIcons';
import { CrossIcon } from '../components/icons/CrossIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { ChevronDownIcon } from '../components/icons/ChevronIcons';
import TaskRunner from '../components/TaskRunner';
import { SparklesIcon } from '../components/icons/SparklesIcon';

const statusClasses: { [key in SeoCheckStatus]: string } = {
    Good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    Warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'Not Found': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
};
const statusIcons: { [key in SeoCheckStatus]: React.ReactNode } = { 
    Good: <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>, 
    Warning: <span className="font-bold text-yellow-600 dark:text-yellow-400">!</span>, 
    Error: <CrossIcon className="w-3 h-3 text-red-600 dark:text-red-400"/>, 
    'Not Found': <span className="font-bold text-slate-600 dark:text-slate-400">?</span>
};

const SerpAnalysisCard: React.FC<{ data: SerpAnalysis }> = ({ data }) => (
    <Card className="lg:col-span-2">
        <h3 className="text-xl font-bold font-heading">🔍 SERP Feature Analysis</h3>
        <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark space-y-4">
            <div>
                <h4 className="font-bold text-sm mb-2">Dominant Features Observed</h4>
                <div className="flex flex-wrap gap-2">
                    {(data.dominantFeatures || []).map(feature => (
                        <span key={feature} className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full px-3 py-1 font-semibold">{feature}</span>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-sm mb-2">Strategic Recommendation</h4>
                <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark italic bg-slate-50 dark:bg-surface-dark/60 p-3 rounded-md">{data.strategicRecommendation}</p>
            </div>
        </div>
    </Card>
);

const OnPageDetailsCard: React.FC<{ data: OnPageSeoDetails }> = ({ data }) => {
    const checks = [
        { title: 'Title Tag', data: data?.titleTag },
        { title: 'Meta Description', data: data?.metaDescription },
        { title: 'Header Hierarchy (H1s, H2s)', data: data?.headerHierarchy },
        { title: 'Image SEO (Alt Text)', data: data?.imageSeo },
        { title: 'Internal Linking', data: data?.internalLinking },
    ];
    
    const defaultCheck: OnPageCheck = { status: 'Not Found', details: 'Data not found.' };

    return (
        <Card className="lg:col-span-1">
            <div className="flex items-center gap-4">
                <ScoreDonut score={data?.score || 0} />
                <h3 className="text-xl font-bold font-heading">📄 On-Page SEO</h3>
            </div>
            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-3">{data?.summary || 'No summary available.'}</p>
            <div className="mt-4 space-y-3 border-t border-border-light dark:border-border-dark pt-4">
                {checks.map(check => {
                    const checkData = check.data || defaultCheck;
                    return (
                        <div key={check.title} className="bg-slate-50 dark:bg-surface-dark/60 p-3 rounded-lg">
                            <h4 className="font-bold text-sm mb-1">{check.title}</h4>
                            <div className="flex items-start gap-2">
                                <div className={`flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full ${statusClasses[checkData.status]}`}>{statusIcons[checkData.status]}</div>
                                <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark">{checkData.details}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const BacklinkProfileCard: React.FC<{ data: BacklinkProfile }> = ({ data }) => {
     return (
        <Card className="lg:col-span-1">
            <div className="flex items-center gap-4">
                <ScoreDonut score={data?.score || 0} />
                <h3 className="text-xl font-bold font-heading">🔗 Backlink Profile</h3>
            </div>
            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-3">{data?.summary || 'No summary available.'}</p>
             <div className="mt-4 space-y-3 border-t border-border-light dark:border-border-dark pt-4 text-sm">
                <div className="flex justify-between p-2 rounded-md bg-slate-50 dark:bg-surface-dark/60">
                    <span className="font-semibold">Estimated Referring Domains:</span>
                    <span className="font-bold text-primary">{data?.estimatedReferringDomains ?? 'N/A'}</span>
                </div>
                 <div className="flex justify-between p-2 rounded-md bg-slate-50 dark:bg-surface-dark/60">
                    <span className="font-semibold">Estimated Authority Score:</span>
                    <span className="font-bold text-primary">{data?.authorityScore ?? 'N/A'}</span>
                </div>
                {data?.profileHealthSummary && (
                    <div className="p-2 rounded-md bg-slate-50 dark:bg-surface-dark/60">
                         <p className="font-semibold mb-1">Profile Health:</p>
                         <p className="text-xs italic text-secondary-text-light dark:text-secondary-text-dark">{data.profileHealthSummary}</p>
                    </div>
                )}
                 {data?.anchorTextThemes && data.anchorTextThemes.length > 0 && (
                    <div className="p-2 rounded-md bg-slate-50 dark:bg-surface-dark/60">
                        <p className="font-semibold mb-2">Common Anchor Text Themes:</p>
                        <div className="flex flex-wrap gap-2">
                            {data.anchorTextThemes.map(theme => <span key={theme} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-1">{theme}</span>)}
                        </div>
                    </div>
                 )}
             </div>
        </Card>
    );
};


const TechnicalHealthCard: React.FC<{ audit: TechnicalSeoAudit }> = ({ audit }) => {
    const checks = [
        { title: 'robots.txt Status', data: audit?.robotsTxt },
        { title: 'Sitemap Status', data: audit?.sitemap },
        { title: 'Core Web Vitals', data: audit?.coreWebVitals },
        { title: 'Structured Data (Schema)', data: audit?.structuredData },
    ];
    
    const defaultCheckData = { status: 'Not Found' as const, details: 'Data for this check was not found in the audit.' };

    return (
        <Card className="lg:col-span-2">
            <div className="flex items-center gap-4">
                <ScoreDonut score={audit?.score || 0} />
                <h3 className="text-xl font-bold font-heading">⚙️ Technical SEO</h3>
            </div>
            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-3">{audit?.summary || 'No summary available.'}</p>
            <div className="mt-4 grid md:grid-cols-2 gap-4 border-t border-border-light dark:border-border-dark pt-4">
                {checks.map(check => {
                    const checkData = check.data || defaultCheckData;
                    const isCwv = check.title === 'Core Web Vitals';
                    return (
                        <div key={check.title} className="bg-slate-50 dark:bg-surface-dark/60 p-3 rounded-lg">
                            <h4 className="text-sm font-bold mb-2">{check.title}</h4>
                            <div className="flex items-start gap-2">
                                <span className={`flex-shrink-0 mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-full ${statusClasses[checkData.status]}`}>{checkData.status}</span>
                                <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark">{checkData.details}</p>
                            </div>
                            {isCwv && (
                                <div className="mt-2 flex gap-3 text-xs border-t border-border-light/50 dark:border-border-dark/50 pt-2">
                                    <span><strong>LCP:</strong> {(checkData as CoreWebVitalsCheck).lcp || 'N/A'}</span>
                                    <span><strong>CLS:</strong> {(checkData as CoreWebVitalsCheck).cls || 'N/A'}</span>
                                    <span><strong>INP:</strong> {(checkData as CoreWebVitalsCheck).inp || 'N/A'}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const KeywordIntelligenceCard: React.FC<{ data: KeywordIntelligence, keywords: string }> = ({ data, keywords }) => (
    <Card className="lg:col-span-2">
        <h3 className="text-xl font-bold font-heading">🎯 Keyword Intelligence for "{keywords.split(',')[0]}"</h3>
        <div className="mt-4 grid md:grid-cols-2 gap-6 pt-4 border-t border-border-light dark:border-border-dark">
            <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                <h4 className="font-bold text-sm mb-2">Dominant SERP Intent</h4>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm font-bold rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-text-dark">{data.serpIntent || 'N/A'}</span>
                    <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark">{data.serpIntentAnalysis}</p>
                </div>
            </div>
            {data.peopleAlsoAsk && data.peopleAlsoAsk.length > 0 && (
                <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                    <h4 className="font-bold text-sm mb-2">People Also Ask</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-secondary-text-light dark:text-secondary-text-dark">
                        {data.peopleAlsoAsk.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                </div>
            )}
             {data.contentGapAnalysis && (
                <div className="md:col-span-2 bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                    <h4 className="font-bold text-sm mb-2">Content Gap Analysis</h4>
                    <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark italic mb-3">"{data.contentGapAnalysis.summary}"</p>
                    <div className="flex flex-wrap gap-2">
                        {(data.contentGapAnalysis.missingTopics || []).map(topic => (
                            <span key={topic} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-1">{topic}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </Card>
);

const ActionPlanTable: React.FC<{ 
    items: ActionItem[];
    onGenerateSuggestion: (itemIndex: number) => void;
}> = ({ items = [], onGenerateSuggestion }) => {
    const [sortConfig, setSortConfig] = useState<{ key: 'impact' | 'effort'; direction: 'asc' | 'desc' } | null>({ key: 'impact', direction: 'desc' });

    const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const effortOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'impact') {
                    aValue = impactOrder[a.impact];
                    bValue = impactOrder[b.impact];
                } else {
                    aValue = effortOrder[a.effort];
                    bValue = effortOrder[b.effort];
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: 'impact' | 'effort') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        if (key === 'impact' && direction === 'asc') direction = 'desc'; // Default impact sort to desc
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: 'impact' | 'effort') => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    };

    const tagClasses = {
        High: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        Easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        Hard: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };

    const isSuggestionEligible = (item: ActionItem) => {
        const keywords = ['title', 'meta description'];
        return item.category === 'On-Page' && keywords.some(kw => item.recommendation.toLowerCase().includes(kw));
    };

    return (
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-surface-dark/60 text-xs uppercase tracking-wider">
                    <tr className="border-b border-border-light dark:border-border-dark">
                        <th scope="col" className="p-4 font-semibold w-3/5">Recommendation</th>
                        <th scope="col" className="p-4 font-semibold text-center">Category</th>
                        <th scope="col" className="p-4 font-semibold text-center cursor-pointer" onClick={() => requestSort('impact')}>Impact {getSortIndicator('impact')}</th>
                        <th scope="col" className="p-4 font-semibold text-center cursor-pointer" onClick={() => requestSort('effort')}>Effort {getSortIndicator('effort')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map((item, index) => (
                        <React.Fragment key={index}>
                            <tr className="border-b border-border-light dark:border-border-dark last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="p-4 align-top">
                                    {item.recommendation}
                                    {isSuggestionEligible(item) && (
                                        <div className="mt-2">
                                            <button 
                                                onClick={() => onGenerateSuggestion(index)}
                                                disabled={item.isGeneratingSuggestions}
                                                className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-md bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-text-dark hover:bg-primary/20 transition disabled:opacity-50"
                                            >
                                                {item.isGeneratingSuggestions ? <Spinner size="small" className="w-3 h-3"/> : <SparklesIcon className="w-3 h-3" />}
                                                {item.isGeneratingSuggestions ? 'Generating...' : 'Generate Suggestion'}
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-center align-top">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-700">{item.category}</span>
                                </td>
                                <td className="p-4 text-center align-top">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${tagClasses[item.impact]}`}>{item.impact}</span>
                                </td>
                                <td className="p-4 text-center align-top">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${tagClasses[item.effort]}`}>{item.effort}</span>
                                </td>
                            </tr>
                            {item.suggestions && item.suggestions.length > 0 && (
                                <tr className="bg-slate-50 dark:bg-surface-dark/50">
                                    <td colSpan={4} className="p-4">
                                        <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-md border border-border-light dark:border-border-dark animate-fade-in-up">
                                            <h5 className="font-semibold text-xs mb-2">💡 Suggestions:</h5>
                                            <ul className="list-disc pl-5 space-y-2 text-xs">
                                                {item.suggestions.map((s, i) => (
                                                    <li key={i} className="text-secondary-text-light dark:text-secondary-text-dark font-mono">{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const SeoOptimizer: React.FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useAppContext();
    const { addToast } = useToast();

    const [url, setUrl] = useState('');
    const [keywords, setKeywords] = useState('');
    const [competitors, setCompetitors] = useState('');
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [results, setResults] = useState<SeoAnalysisResult | null>(null);
    const [auditError, setAuditError] = useState<string | null>(null);
    const [isManualInputOpen, setIsManualInputOpen] = useState(false);
    const [manualHtml, setManualHtml] = useState('');
    
    const [latestUpdates, setLatestUpdates] = useState<GroundedResponse | null>(null);
    const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const updates = await getLatestGoogleUpdates();
                setLatestUpdates(updates);
            } catch (err) {
                console.error(err);
                setLatestUpdates({ text: "Could not fetch latest Google updates.", sources: [] });
            } finally {
                setIsLoadingUpdates(false);
            }
        };
        fetchUpdates();
    }, []);

    const handleAnalyze = async () => {
        if (!url) {
            addToast("Please enter a URL to analyze.", 'error');
            return;
        }
        setLoading(true);
        setResults(null);
        setAuditError(null);
        setIsManualInputOpen(false);
        
        const initialTasks = [{ name: `Auditing Your Site: ${url}`, status: 'pending' as const }];
        if (competitors) {
            competitors.split(',').forEach(c => {
                initialTasks.push({ name: `Auditing Competitor: ${c.trim()}`, status: 'pending' as const });
            });
        }
        initialTasks.push({ name: "Synthesizing Action Plan & Strategy", status: 'pending' as const });
        setTasks(initialTasks);

        try {
            const orchestrator = generateOrchestratedSeoAnalysis(url, keywords, competitors);
            for await (const update of orchestrator) {
                 setTasks(currentTasks => {
                    const updateIndex = initialTasks.findIndex(t => t.name === update.task);
                    if (updateIndex === -1) return currentTasks;

                    return currentTasks.map((task, idx) => {
                        if (idx < updateIndex) return { ...task, status: 'complete' };
                        if (idx === updateIndex) return { ...task, status: update.status };
                        return task;
                    });
                });
                if (update.result) {
                    setResults(update.result);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setAuditError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleManualAnalyze = async () => {
        if (!manualHtml) {
            addToast("Please paste the page's HTML source code.", 'error');
            return;
        }
        setLoading(true);
        setResults(null);
        setAuditError(null);
        setTasks([{ name: `Analyzing Manual HTML for ${url}`, status: 'running' }]);

        try {
            const audit = await performManualSeoAudit(manualHtml, url, keywords);
            setResults({
                userSiteAnalysis: audit,
                // Competitor/summary analysis is not available in manual mode
            });
            setTasks(prev => prev.map(t => ({...t, status: 'complete'})));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during manual analysis.";
            setAuditError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setLoading(false);
            setIsManualInputOpen(false);
        }
    };
    
    const handleGenerateSuggestion = async (itemIndex: number) => {
        if (!results?.userSiteAnalysis?.actionPlan?.items) return;
    
        const item = results.userSiteAnalysis.actionPlan.items[itemIndex];
        const type = item.recommendation.toLowerCase().includes('title') ? 'title' : 'meta description';
    
        setResults(prevResults => {
            if (!prevResults) return null;
            const newItems = [...prevResults.userSiteAnalysis.actionPlan.items];
            newItems[itemIndex] = { ...newItems[itemIndex], isGeneratingSuggestions: true, suggestions: [] };
            return {
                ...prevResults,
                userSiteAnalysis: {
                    ...prevResults.userSiteAnalysis,
                    actionPlan: {
                        ...prevResults.userSiteAnalysis.actionPlan,
                        items: newItems,
                    },
                },
            };
        });
    
        try {
            const suggestions = await generateSeoCopySuggestion(type, {
                url,
                keywords,
                currentText: 'N/A' // Context can be improved later
            });
    
            setResults(prevResults => {
                if (!prevResults) return null;
                const newItems = [...prevResults.userSiteAnalysis.actionPlan.items];
                newItems[itemIndex] = { ...newItems[itemIndex], isGeneratingSuggestions: false, suggestions };
                return {
                     ...prevResults,
                    userSiteAnalysis: {
                        ...prevResults.userSiteAnalysis,
                        actionPlan: {
                            ...prevResults.userSiteAnalysis.actionPlan,
                            items: newItems,
                        },
                    },
                };
            });
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to generate suggestions", 'error');
            setResults(prevResults => {
                if (!prevResults) return null;
                const newItems = [...prevResults.userSiteAnalysis.actionPlan.items];
                newItems[itemIndex] = { ...newItems[itemIndex], isGeneratingSuggestions: false };
                 return {
                     ...prevResults,
                    userSiteAnalysis: {
                        ...prevResults.userSiteAnalysis,
                        actionPlan: {
                            ...prevResults.userSiteAnalysis.actionPlan,
                            items: newItems,
                        },
                    },
                };
            });
        }
    };

    const renderMainContent = () => {
        if (loading) {
             return (
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-heading">Niti AI is Analyzing SEO...</h2>
                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-2xl mx-auto">This may take a moment. Niti AI is performing live web crawls and analyzing your site.</p>
                    <TaskRunner tasks={tasks} />
                </div>
            );
        }

        if (auditError) {
            return (
                <div className="space-y-6">
                    <Card className="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30">
                        <h3 className="text-lg font-bold font-heading text-red-800 dark:text-red-200">Analysis Failed</h3>
                        <p className="mt-2 text-red-700 dark:text-red-300">{auditError}</p>
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">This can happen if the site blocks crawlers or uses heavy JavaScript. You can try a manual analysis instead.</p>
                        <button
                            onClick={() => setIsManualInputOpen(true)}
                            className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover transition"
                        >
                            🔧 Try Manual Analysis
                        </button>
                    </Card>
                    {isManualInputOpen && (
                        <Card className="animate-fade-in-up">
                            <h3 className="text-lg font-bold font-heading">Manual Analysis</h3>
                            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-2">
                                In your browser, go to the URL, right-click, and select "View Page Source". Copy all the text and paste it below.
                            </p>
                            <div className="mt-4">
                                <textarea
                                    value={manualHtml}
                                    onChange={(e) => setManualHtml(e.target.value)}
                                    placeholder="Paste HTML source code here..."
                                    className="w-full h-48 p-3 bg-slate-100 dark:bg-slate-800/50 border-2 border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-xs"
                                />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleManualAnalyze}
                                    className="px-5 py-2.5 text-sm text-white font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md shadow-primary/30"
                                >
                                    Analyze Manual Data
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            );
        }

        if (results) {
             return (
                <div className="animate-fade-in-up space-y-12">
                    {results.competitiveSummary && (
                        <section>
                            <h2 className="text-3xl font-bold font-heading mb-4">🤺 Competitive Analysis</h2>
                            <Card>
                                <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mb-4">{results.competitiveSummary.comparison}</p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {(results.competitiveSummary.opportunities || []).map((opp, i) => (
                                        <div key={i} className="bg-emerald-50 dark:bg-emerald-900/40 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                            <h4 className="font-bold text-emerald-800 dark:text-emerald-200">{opp.opportunity}</h4>
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">{opp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </section>
                    )}

                    <section>
                        <h2 className="text-3xl font-bold font-heading mb-4">📈 Core Audit Dashboard</h2>
                        <div className="grid lg:grid-cols-2 gap-8">
                            <OnPageDetailsCard data={results.userSiteAnalysis.onPage} />
                            <BacklinkProfileCard data={results.userSiteAnalysis.backlinks} />
                            <TechnicalHealthCard audit={results.userSiteAnalysis.technical} />
                            <Card className="lg:col-span-1">
                                <div className="flex items-center gap-4">
                                    <ScoreDonut score={results.userSiteAnalysis.content?.score || 0} />
                                    <h3 className="text-xl font-bold font-heading">✍️ Content & E-E-A-T</h3>
                                </div>
                                <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-3">{results.userSiteAnalysis.content?.summary || 'No summary available.'}</p>
                            </Card>
                            {results.userSiteAnalysis.keywordIntelligence && keywords && (
                                <KeywordIntelligenceCard data={results.userSiteAnalysis.keywordIntelligence} keywords={keywords} />
                            )}
                            {results.userSiteAnalysis.serpAnalysis && (
                                <SerpAnalysisCard data={results.userSiteAnalysis.serpAnalysis} />
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold font-heading mb-4">⭐ Priority Action Plan</h2>
                        <Card>
                            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mb-4">{results.userSiteAnalysis.actionPlan?.summary}</p>
                            {results.userSiteAnalysis.actionPlan?.items && (
                                <ActionPlanTable items={results.userSiteAnalysis.actionPlan.items} onGenerateSuggestion={handleGenerateSuggestion} />
                            )}
                        </Card>
                    </section>
                </div>
            );
        }

        return (
             <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                    <SeoIcon className="w-12 h-12 text-white"/>
                </div>
                <h3 className="text-2xl font-bold font-heading">Welcome to the SEO Optimizer</h3>
                <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">Enter a URL in the sidebar to get a full Niti AI-powered SEO audit and a prioritized action plan.</p>
            </div>
        );
    }


    return (
        <>
             <div
              onClick={() => setIsSidebarOpen(false)}
              className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${
                isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden="true"
            />
            <div className="flex h-full">
                 <aside 
                    data-tour-id="seo-config"
                    className={`
                        fixed lg:static inset-y-0 left-0 h-full
                        w-full max-w-sm xl:max-w-md 2xl:max-w-lg bg-surface-light dark:bg-surface-dark 
                        border-r border-border-light dark:border-border-dark 
                        flex flex-col z-40 transition-transform transform
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0 
                        ${!isSidebarOpen ? 'hidden lg:flex' : 'flex'}
                    `}
                >
                    <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                        <h2 className="text-xl font-bold font-heading flex items-center gap-3"><CogIcon className="w-6 h-6 text-subtle-text-light dark:text-subtle-text-dark" /> Configuration</h2>
                         <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-secondary-text-light dark:text-secondary-text-dark" aria-label="Close configuration">
                            <CrossIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                        <Input id="url" label="Website URL" value={url} onChange={(_, val) => setUrl(val)} placeholder="https://example.com" />
                        <Input id="keywords" label="Target Keywords (Optional)" value={keywords} onChange={(_, val) => setKeywords(val)} placeholder="e.g., sustainable watches, minimalist design" />
                        <Input id="competitors" label="Competitors (Optional)" value={competitors} onChange={(_, val) => setCompetitors(val)} placeholder="comma-separated URLs" />
                        
                        <Card className="!p-4 bg-slate-50 dark:bg-surface-dark/60">
                            <h3 className="font-bold font-heading mb-2">Latest from Google Search</h3>
                            {isLoadingUpdates ? <Spinner size="small" /> : (
                                <div>
                                    <MarkdownContent content={latestUpdates?.text || 'No updates found.'} />
                                </div>
                            )}
                        </Card>
                    </div>
                    <div className="p-6 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-dark/50">
                        <button onClick={handleAnalyze} disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            {loading ? <><Spinner size="small" /><span className="ml-3">Analyzing...</span></> : '🚀 Analyze SEO'}
                        </button>
                    </div>
                </aside>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <div className="max-w-7xl mx-auto">
                           {renderMainContent()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SeoOptimizer;
