import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import type { CalendarEntry, CalendarEntryStatus, OutreachProspect, ContentGenerationParams } from '../types';
import { Tab } from '../types';
import { generateContentCalendar, generateOutreachMessages, generatePostContent } from '../services/geminiService';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { PlannerIcon } from '../components/icons/TabIcons';
import Input from '../components/Input';
import { PaperPlaneIcon } from '../components/icons/PaperPlaneIcon';
import { MarkdownContent } from '../components/Chat/MarkdownContent';
import { CalendarDaysIcon } from '../components/icons/CalendarDaysIcon';

const statusStyles: { [key in CalendarEntryStatus]: string } = {
    'To Do': 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Done': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
};

const AddEntryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Omit<CalendarEntry, 'id' | 'isGenerating'>) => void;
    initialData: Partial<CalendarEntry>;
}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [entry, setEntry] = useState<Partial<CalendarEntry>>({ status: 'To Do', ...initialData });
    const { addToast } = useToast();

    useEffect(() => {
        setEntry({ status: 'To Do', ...initialData });
    }, [initialData, isOpen]);

    const handleSave = () => {
        if (!entry.date) {
            addToast("Please select a date.", 'error');
            return;
        }
        if (!entry.platform) {
            addToast("Please specify a platform.", 'error');
            return;
        }
        if (!entry.topic) {
            addToast("Please provide a topic.", 'error');
            return;
        }
        if (!entry.contentType) {
            addToast("Please specify a content type.", 'error');
            return;
        }

        onSave(entry as Omit<CalendarEntry, 'id' | 'isGenerating'>);
        onClose();
    };

    if (!isOpen) return null;

    const handleChange = (id: string, value: string) => {
        setEntry(prev => ({...prev, [id]: value}));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold font-heading flex items-center gap-3"><CalendarDaysIcon className="w-6 h-6"/> Add Calendar Entry</h2>
                {initialData.generatedContent && (
                     <p className="text-sm mt-2 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md">
                        Content pre-filled from Resonance Lab.
                    </p>
                )}
                <div className="mt-6 space-y-4">
                    <Input id="date" label="Date" type="date" value={entry.date || ''} onChange={handleChange} />
                    <Input id="platform" label="Platform" value={entry.platform || ''} onChange={handleChange} placeholder="e.g., Instagram" />
                    <Input id="contentType" label="Content Type" value={entry.contentType || ''} onChange={handleChange} placeholder="e.g., Carousel Post" />
                    <Input id="topic" label="Topic" type="textarea" value={entry.topic || ''} onChange={handleChange} />
                    {entry.generatedContent && (
                        <div>
                            <label className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark mb-1.5">
                                Content
                            </label>
                            <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg prose prose-sm dark:prose-invert max-w-none text-xs max-h-40 overflow-y-auto">
                                <MarkdownContent content={entry.generatedContent} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors">
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    )
}

const CalendarItem: React.FC<{
    item: CalendarEntry;
    onStatusChange: (id: string, newStatus: CalendarEntryStatus) => void;
    onGenerateContent: (id: string) => void;
}> = ({ item, onStatusChange, onGenerateContent }) => {
    const { addToast } = useToast();

    const handleCopyContent = () => {
        if (item.generatedContent) {
            navigator.clipboard.writeText(item.generatedContent);
            addToast("Content copied to clipboard!", "success");
        }
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg border border-border-light dark:border-border-dark flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                    <p className="font-bold">{item.topic}</p>
                    <div className="flex items-center gap-2 text-xs text-secondary-text-light dark:text-secondary-text-dark mt-1">
                        <span>{item.platform}</span>
                        <span className="text-subtle-text-light dark:text-subtle-text-dark">&bull;</span>
                        <span>{item.contentType}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select 
                        value={item.status} 
                        onChange={(e) => onStatusChange(item.id, e.target.value as CalendarEntryStatus)}
                        className={`text-xs font-semibold py-1 px-2 rounded-md border-0 focus:ring-2 focus:ring-primary ${statusStyles[item.status]}`}
                    >
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                    </select>
                    <button
                        onClick={() => onGenerateContent(item.id)}
                        disabled={item.isGenerating}
                        className="flex-1 sm:flex-initial text-xs text-white font-semibold bg-primary hover:bg-primary-hover rounded-md px-3 py-1.5 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {item.isGenerating ? <><Spinner size="small" /> Generating...</> : '✨ Create Content'}
                    </button>
                </div>
            </div>
            {item.generatedContent && (
                <div className="mt-2 pt-4 border-t border-border-light dark:border-border-dark animate-fade-in space-y-3">
                    <h4 className="text-sm font-semibold">Generated Content:</h4>
                    <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownContent content={item.generatedContent} />
                    </div>
                    <div className="text-right">
                        <button onClick={handleCopyContent} className="text-xs font-semibold py-1 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition">
                            Copy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const OutreachCoPilot: React.FC = () => {
    const { getActiveProject, updateActiveProjectData } = useAppContext();
    const { addToast } = useToast();
    const activeProject = getActiveProject();
    const strategy = activeProject?.strategy;
    const personas = strategy?.targetPersonas || [];
    const outreachProspects = activeProject?.outreachProspects || [];

    const [selectedPersonaName, setSelectedPersonaName] = useState<string>('');
    const [linkedInUrl, setLinkedInUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Pre-select the first persona if available
        if (personas.length > 0 && !selectedPersonaName) {
            setSelectedPersonaName(personas[0].name);
        }
    }, [personas, selectedPersonaName]);

    const handleGenerate = async () => {
        if (!selectedPersonaName || !linkedInUrl) {
            addToast("Please select a persona and enter a LinkedIn URL.", 'error');
            return;
        }
        
        const selectedPersona = personas.find(p => p.name === selectedPersonaName);
        if (!selectedPersona || !activeProject?.businessData) {
            addToast("Could not find the selected persona or business data.", 'error');
            return;
        }
        
        setIsLoading(true);
        const newProspectId = `prospect_${Date.now()}`;

        // Add a temporary loading prospect to the UI
        const tempProspect: OutreachProspect = {
            id: newProspectId,
            linkedInUrl,
            personaName: selectedPersonaName,
            prospectName: "Analyzing...",
            prospectSummary: "",
            messages: [],
            isGenerating: true,
        };
        updateActiveProjectData({ outreachProspects: [tempProspect, ...(getActiveProject()?.outreachProspects || [])] });

        try {
            const result = await generateOutreachMessages(selectedPersona, linkedInUrl, activeProject.businessData);
            const newProspect: OutreachProspect = {
                id: newProspectId,
                linkedInUrl,
                personaName: selectedPersonaName,
                ...result,
            };
            // Replace temp prospect with the real result
            updateActiveProjectData({ outreachProspects: getActiveProject()?.outreachProspects?.map(p => p.id === newProspectId ? newProspect : p) || [newProspect] });
            setLinkedInUrl(''); // Clear input on success
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to generate outreach.", 'error');
            // Remove the temp prospect on error
            updateActiveProjectData({ outreachProspects: getActiveProject()?.outreachProspects?.filter(p => p.id !== newProspectId) || [] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveProspect = (id: string) => {
        updateActiveProjectData({ outreachProspects: outreachProspects.filter(p => p.id !== id) });
    };

    const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = () => {
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            addToast("Message copied!", "success");
            setTimeout(() => setCopied(false), 2000);
        };
        return (
            <button onClick={handleCopy} className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-secondary-text-light dark:text-secondary-text-dark font-semibold py-1 px-2 rounded-md transition">
                {copied ? 'Copied!' : 'Copy'}
            </button>
        );
    };

    if (!strategy) return null; // Only show if strategy exists

    return (
        <div className="mt-8">
             <Card>
                <h2 className="text-2xl font-bold font-heading flex items-center gap-3"><PaperPlaneIcon className="w-6 h-6" /> AI Outreach Co-Pilot</h2>
                <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-2 mb-6">Generate hyper-personalized outreach messages by combining your strategic personas with live LinkedIn profile data.</p>
                
                <div className="grid md:grid-cols-3 gap-4 items-end p-4 bg-slate-50 dark:bg-surface-dark/60 rounded-lg">
                    <Input
                        id="persona"
                        label="Select Target Persona"
                        type="select"
                        value={selectedPersonaName}
                        onChange={(_, val) => setSelectedPersonaName(val)}
                    >
                        {personas.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </Input>
                     <Input
                        id="linkedinUrl"
                        label="Prospect's LinkedIn URL"
                        value={linkedInUrl}
                        onChange={(_, val) => setLinkedInUrl(val)}
                        placeholder="https://linkedin.com/in/..."
                    />
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full text-white font-bold py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        {isLoading ? <><Spinner size="small" /><span className="ml-3">Generating...</span></> : '✨ Generate Outreach'}
                    </button>
                </div>

                <div className="mt-6 space-y-4">
                    {outreachProspects.map(prospect => (
                         <div key={prospect.id} className="bg-slate-50 dark:bg-surface-dark/50 p-4 rounded-xl border border-border-light dark:border-border-dark animate-fade-in-up relative">
                            {prospect.isGenerating ? (
                                <div className="flex items-center gap-3">
                                    <Spinner size="small" />
                                    <p className="text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark">Analyzing profile...</p>
                                </div>
                            ) : (
                                <>
                                <button onClick={() => handleRemoveProspect(prospect.id)} className="absolute top-3 right-3 text-secondary-text-light dark:text-secondary-text-dark hover:text-danger">&times;</button>
                                <h3 className="font-bold text-lg">{prospect.prospectName} <span className="text-sm font-normal text-secondary-text-light dark:text-secondary-text-dark">({prospect.personaName})</span></h3>
                                <p className="text-xs text-subtle-text-light dark:text-subtle-text-dark mb-4">{prospect.linkedInUrl}</p>
                                <p className="text-sm italic text-secondary-text-light dark:text-secondary-text-dark border-l-2 border-border-light dark:border-border-dark pl-3 mb-4">{prospect.prospectSummary}</p>

                                <div className="space-y-3">
                                    {prospect.messages.map((msg, index) => (
                                        <div key={index} className="bg-surface-light dark:bg-surface-dark p-3 rounded-lg">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="text-sm flex-1">{msg.message}</p>
                                                <CopyButton textToCopy={msg.message} />
                                            </div>
                                            <p className="text-xs text-subtle-text-light dark:text-subtle-text-dark mt-2 pt-2 border-t border-border-light dark:border-border-dark"><strong>Hook:</strong> {msg.hook}</p>
                                        </div>
                                    ))}
                                </div>
                                </>
                            )}
                         </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};


const Planner: React.FC = () => {
    const { getActiveProject, updateActiveProjectData, setActiveTab, plannerPrefill, setPlannerPrefill } = useAppContext();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [initialModalData, setInitialModalData] = useState<Partial<CalendarEntry>>({});

    const activeProject = getActiveProject();
    const strategy = activeProject?.strategy;
    const businessData = activeProject?.businessData;
    const calendar = activeProject?.calendar || [];

    const handleGenerateCalendar = useCallback(async (creativeMessage?: string) => {
        if (!strategy) {
            addToast("Please generate a strategy first.", 'error');
            return;
        }
        setIsLoading(true);
        try {
            const calendarData = await generateContentCalendar(strategy, creativeMessage);
            updateActiveProjectData({ calendar: calendarData });
            addToast(creativeMessage ? "Content calendar generated from your creative!" : "Content calendar generated successfully!", 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to generate calendar.", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [strategy, updateActiveProjectData, addToast]);

    useEffect(() => {
        if (plannerPrefill) {
            if (plannerPrefill.action === 'generate') {
                handleGenerateCalendar(plannerPrefill.topic);
            } else { // 'prefill' or undefined
                setInitialModalData({
                    topic: plannerPrefill.topic,
                    generatedContent: plannerPrefill.generatedContent,
                    contentType: plannerPrefill.contentType,
                });
                setIsAddModalOpen(true);
            }
            setPlannerPrefill(null); // Clear after handling
        }
    }, [plannerPrefill, setPlannerPrefill, handleGenerateCalendar]);

    const handleStatusChange = (id: string, newStatus: CalendarEntryStatus) => {
        const updatedCalendar = calendar.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
        );
        updateActiveProjectData({ calendar: updatedCalendar });
    };
    
    const handleGenerateContent = async (id: string) => {
        const item = calendar.find(i => i.id === id);
        if (!item || !strategy || !businessData) {
            addToast("Cannot generate content without strategy and business data.", "error");
            return;
        }

        const updatedCalendar = calendar.map(i => 
            i.id === id ? { ...i, isGenerating: true, generatedContent: undefined } : i
        );
        updateActiveProjectData({ calendar: updatedCalendar });

        try {
            const params: ContentGenerationParams = {
                platform: item.platform.toLowerCase(),
                topic: item.topic,
                type: item.contentType,
                tone: '', // AI will infer based on context
                keywords: '',
            };
            const knowledgeBase = activeProject?.knowledgeBase;
            const content = await generatePostContent(params, null, businessData, strategy, undefined, knowledgeBase);
            
            const finalCalendar = (getActiveProject()?.calendar || []).map(i =>
                i.id === id ? { ...i, isGenerating: false, generatedContent: content } : i
            );
            updateActiveProjectData({ calendar: finalCalendar });
            addToast("Content generated!", "success");

        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to generate content.", "error");
            const finalCalendar = (getActiveProject()?.calendar || []).map(i =>
                i.id === id ? { ...i, isGenerating: false } : i
            );
            updateActiveProjectData({ calendar: finalCalendar });
        }
    };

    const handleSaveNewEntry = (newEntryData: Omit<CalendarEntry, 'id' | 'isGenerating'>) => {
        const newEntry: CalendarEntry = {
            id: `cal-item-${Date.now()}`,
            ...newEntryData,
        };
        const updatedCalendar = [...calendar, newEntry];
        updateActiveProjectData({ calendar: updatedCalendar });
        addToast("New entry added to calendar!", "success");
    };

    const handleOpenAddModal = () => {
        setInitialModalData({});
        setIsAddModalOpen(true);
    };

    const groupedByDate = calendar.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {} as Record<string, CalendarEntry[]>);

    const sortedDates = Object.keys(groupedByDate).sort();

    const renderContent = () => {
        if (!strategy) {
            return (
                 <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                        <PlannerIcon className="w-12 h-12 text-white"/>
                    </div>
                    <h3 className="text-2xl font-bold font-heading">First, Create a Strategy</h3>
                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">
                        The AI needs a marketing strategy to build your content calendar and outreach messages. Go to the Strategy Builder to get started.
                    </p>
                    <button 
                        onClick={() => setActiveTab(Tab.Strategy)}
                        className="mt-6 text-white font-bold py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
                    >
                        Go to Strategy Builder
                    </button>
                </div>
            );
        }

        if (isLoading) {
             return (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Spinner size="large" />
                    <h3 className="text-xl font-semibold font-heading mt-4">Niti AI is Building Your Calendar...</h3>
                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1 max-w-sm">This may take a moment. The AI is turning your strategy into a day-by-day plan.</p>
                </div>
             );
        }

        if (calendar.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                        <PlannerIcon className="w-12 h-12 text-white"/>
                    </div>
                    <h3 className="text-2xl font-bold font-heading">Ready to Plan Your Content?</h3>
                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">
                       Click the button below to have Niti AI automatically generate a 30-day content calendar based on your marketing strategy.
                    </p>
                    <div className="flex items-center gap-4 mt-6">
                        <button 
                            onClick={() => handleGenerateCalendar()}
                            className="text-white font-bold py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
                        >
                            ✨ Generate Content Calendar
                        </button>
                         <button 
                            onClick={handleOpenAddModal}
                            className="font-bold py-3 px-6 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                        >
                            + Add Post Manually
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <Card>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <h2 className="text-2xl font-bold font-heading">Your 30-Day Content Plan</h2>
                         <div className="flex flex-col sm:flex-row gap-2">
                             <button 
                                onClick={handleOpenAddModal}
                                className="font-semibold py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                            >
                                + Add Post
                            </button>
                            <button 
                                onClick={() => handleGenerateCalendar()}
                                disabled={isLoading}
                                className="w-full sm:w-auto text-white font-bold py-2 px-5 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center justify-center"
                            >
                                🔄 Regenerate Plan
                            </button>
                         </div>
                    </div>
                </Card>
                 {sortedDates.map(date => (
                    <div key={date}>
                        <h3 className="font-bold mb-2 ml-1">
                            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h3>
                        <div className="space-y-3">
                            {groupedByDate[date].map(item => (
                                <CalendarItem key={item.id} item={item} onStatusChange={handleStatusChange} onGenerateContent={handleGenerateContent} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
             <AddEntryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveNewEntry}
                initialData={initialModalData}
            />
            <div className="max-w-4xl mx-auto">
                {renderContent()}
                <OutreachCoPilot />
            </div>
        </div>
    );
};

export default Planner;
