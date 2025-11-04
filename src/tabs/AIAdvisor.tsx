
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType, ProactiveAdvice, KnowledgeBase, Task as TaskType } from '../types';
import { Tab } from '../types';
import { generateGroundedContent } from '../services/groundedModelService';
import { generateProactiveAdvice, buildOrchestratedKnowledgeBase } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Input from '../components/Input';
import ChatMessage from '../components/Chat/ChatMessage';
import { SendIcon } from '../components/icons/SendIcon';
import { StrategyIcon, ContentIcon, CampaignIcon, SeoIcon } from '../components/icons/TabIcons';
import { BrainIcon } from '../components/icons/BrainIcon';
import { MarkdownContent } from '../components/Chat/MarkdownContent';
import { ChevronDownIcon } from '../components/icons/ChevronIcons';
import TaskRunner from '../components/TaskRunner';
import { MicrophoneIcon } from '../components/icons/MicrophoneIcon';

const AdviceCard: React.FC<{ advice: ProactiveAdvice }> = ({ advice }) => {
    const impactClasses: { [key: string]: string } = {
        'High': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300',
        'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-400',
        'Low': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300',
    };

    const iconMap: { [key: string]: React.ReactNode } = {
        [Tab.Strategy]: <StrategyIcon className="w-5 h-5" />,
        [Tab.Content]: <ContentIcon className="w-5 h-5" />,
        [Tab.Campaigns]: <CampaignIcon className="w-5 h-5" />,
        [Tab.Seo]: <SeoIcon className="w-5 h-5" />,
    };

    return (
        <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-xl border-l-4 border-primary">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-primary">{iconMap[advice.area] || '💡'}</span>
                    <h4 className="font-bold font-heading capitalize">{advice.area}</h4>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${impactClasses[advice.impact]}`}>{advice.impact} Impact</span>
            </div>
            <div className="text-sm space-y-2 text-secondary-text-light dark:text-secondary-text-dark">
                <p><strong>Observation:</strong> {advice.observation}</p>
                <p><strong>Recommendation:</strong> {advice.recommendation}</p>
            </div>
        </div>
    );
};

const initialLearningTasks: TaskType[] = [
    { name: "Parsing Training Methodology", status: 'pending' },
    { name: "Analyzing Fundamentals Document", status: 'pending' },
    { name: "Analyzing Advanced Strategies Document", status: 'pending' },
    { name: "Analyzing Analytics & KPIs Document", status: 'pending' },
    { name: "Synthesizing Knowledge Base", status: 'pending' },
];


const AIAdvisor: React.FC = () => {
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { getActiveProject, clearAppData } = useAppContext();
    const { addToast } = useToast();
    const [proactiveAdvice, setProactiveAdvice] = useState<ProactiveAdvice[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    // State for Knowledge Base
    const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
    const [isBuildingKB, setIsBuildingKB] = useState(false);
    const [isKbExpanded, setIsKbExpanded] = useState(false);
    const [learningTasks, setLearningTasks] = useState<TaskType[]>(initialLearningTasks);

    // State for Voice Conversation
    const recognitionRef = useRef<any | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const queryRef = useRef(query);
    useEffect(() => { queryRef.current = query; }, [query]);

    // Effect to setup SpeechRecognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                addToast("Microphone access was denied. Please allow it in your browser settings.", 'error');
            } else if (event.error !== 'no-speech') {
                addToast(`An error occurred: ${event.error}`, 'error');
            }
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
            // Use ref to get latest query value and auto-send
            if (queryRef.current.trim()) {
                handleSendMessage(queryRef.current);
            }
        };

        recognitionRef.current = recognition;
        
        // Cleanup function
        return () => {
            if (recognitionRef.current) {
               recognitionRef.current.abort();
            }
            window.speechSynthesis.cancel();
        };

    }, [addToast]);


    const activeProject = getActiveProject();

    useEffect(() => {
        // Load knowledge base from localStorage on component mount
        try {
            const kbString = localStorage.getItem('yugn-ai-knowledge-base');
            if (kbString) {
                setKnowledgeBase(JSON.parse(kbString));
            }
        } catch (e) {
            console.error("Failed to load knowledge base from localStorage", e);
        }
    }, []);
    

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [chatHistory]);

    const handleScan = async () => {
        if (!activeProject?.strategy || !activeProject?.businessData) {
            addToast("Please generate a marketing strategy first in the 'Strategy Builder' tab for the current project.", 'info');
            return;
        }
        setIsScanning(true);
        setProactiveAdvice([]);
        try {
            const advice = await generateProactiveAdvice(activeProject.businessData, activeProject.strategy);
            setProactiveAdvice(advice);
            if (advice.length === 0) {
                 addToast("Yugn AI scan complete. No high-priority issues found!", 'success');
            }
        } catch (err) {
             addToast(err instanceof Error ? err.message : 'Failed to get proactive advice.', 'error');
        } finally {
            setIsScanning(false);
        }
    };
    
    const handleClearMemory = () => {
        if (window.confirm("Are you sure you want to clear Yugn AI's memory? This will erase all projects, the knowledge base, and other data.")) {
            clearAppData();
            handleClearKnowledgeBase(false); // don't show confirm dialog again
            addToast("All project data has been cleared.", 'success');
        }
    };

    const handleSendMessage = async (messageToSend?: string) => {
        const currentQuery = messageToSend ?? query;
        if (!currentQuery.trim() || loading) return;

        const conversationContext = [...chatHistory].reverse().find(m => m.sender === 'ai')?.text;
        const projectBrain = getActiveProject()?.knowledgeBase || '';
        
        const fullContext = `
            ${projectBrain ? `**Current Project Knowledge Base ("Project Brain"):**\n${projectBrain}\n\n` : ''}
            ${conversationContext ? `**Previous turn in this conversation:**\n${conversationContext}` : ''}
        `.trim();


        const userMessage: ChatMessageType = { id: `user-${Date.now()}`, sender: 'user', text: currentQuery };
        const loadingMessage: ChatMessageType = { id: `loading-${Date.now()}`, sender: 'ai', text: '', isLoading: true };

        setChatHistory(prev => [...prev, userMessage, loadingMessage]);
        setQuery('');
        setLoading(true);
        setError(null);

        try {
            const response = await generateGroundedContent(currentQuery, fullContext);
            const messageId = `ai-${Date.now()}`;
            const newAiMessage: ChatMessageType = { id: messageId, sender: 'ai', text: response.text, sources: response.sources };
            setChatHistory(prev => [...prev.slice(0, -1), newAiMessage]);

            // Text-to-Speech
            const utterance = new SpeechSynthesisUtterance(response.text);
            utterance.onstart = () => setSpeakingMessageId(messageId);
            utterance.onend = () => setSpeakingMessageId(null);
            utterance.onerror = () => setSpeakingMessageId(null);
            window.speechSynthesis.speak(utterance);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setChatHistory(prev => prev.slice(0, -1)); 
        } finally {
            setLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleBuildKnowledgeBase = async () => {
        setIsBuildingKB(true);
        setLearningTasks(initialLearningTasks);

        try {
            const orchestrator = buildOrchestratedKnowledgeBase();
            for await (const update of orchestrator) {
                setLearningTasks(currentTasks => {
                    const updateIndex = currentTasks.findIndex(t => t.name === update.stage);
                    if (updateIndex === -1) return currentTasks; // Should not happen

                    return currentTasks.map((task, idx) => {
                        if (idx < updateIndex) return { ...task, status: 'complete' };
                        if (idx === updateIndex) return { ...task, status: update.status };
                        return task;
                    });
                });

                if (update.result) {
                    const newKb: KnowledgeBase = {
                        content: update.result,
                        lastUpdated: new Date().toISOString(),
                    };
                    localStorage.setItem('yugn-ai-knowledge-base', JSON.stringify(newKb));
                    setKnowledgeBase(newKb);
                    addToast("Yugn AI knowledge base has been updated!", 'success');
                }
            }
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Failed to build knowledge base.", 'error');
        } finally {
            setIsBuildingKB(false);
        }
    };
    
    const handleClearKnowledgeBase = (confirm = true) => {
        const doClear = !confirm || window.confirm("Are you sure you want to clear the AI's knowledge base? This cannot be undone.");
        if (doClear) {
            localStorage.removeItem('yugn-ai-knowledge-base');
            setKnowledgeBase(null);
            addToast("Knowledge base cleared.", 'info');
        }
    };

    const handleToggleListening = () => {
        if (!recognitionRef.current) {
            addToast("Voice input is not supported on this browser.", "error");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            // Stop any ongoing speech before starting to listen
            handleStopSpeaking();
            
            setQuery(''); // Clear query before starting to listen
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleStopSpeaking = () => {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                     <Card>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                                <span className="text-white text-4xl">🤖</span>
                            </div>
                            <div className="flex-grow w-full">
                                <h2 className="text-xl font-bold font-heading">Proactive Yugn AI Advisor</h2>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1">
                                    Let Yugn AI scan your current project's strategy for potential issues and optimization opportunities.
                                </p>
                            </div>
                             <button onClick={handleScan} disabled={isScanning || !activeProject?.strategy} className="w-full sm:w-auto flex-shrink-0 text-white font-bold py-3 px-6 rounded-xl bg-primary hover:bg-primary-hover hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                {isScanning ? <><Spinner size="small" /> <span className="ml-3">Scanning...</span></> : 'Scan for Advice'}
                            </button>
                        </div>
                        {proactiveAdvice.length > 0 && (
                            <div className="mt-6 border-t border-border-light dark:border-border-dark pt-6 space-y-4 animate-fade-in-up">
                                {proactiveAdvice.map((advice, i) => <AdviceCard key={i} advice={advice} />)}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <BrainIcon className="w-9 h-9 text-white" />
                            </div>
                            <div className="flex-grow w-full">
                                <h2 className="text-xl font-bold font-heading">AI Training Curriculum</h2>
                                <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-1">
                                    To ensure the highest quality strategies, Yugn AI studies core marketing pillars. This creates a foundational knowledge base stored in your browser.
                                    {knowledgeBase && ` (Last updated: ${new Date(knowledgeBase.lastUpdated).toLocaleString()})`}
                                </p>
                                {!isBuildingKB && (
                                    <div className="mt-4">
                                        <button onClick={handleBuildKnowledgeBase} className="text-white font-bold py-2.5 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-indigo-500/30">
                                            {knowledgeBase ? 'Begin Re-Training' : 'Begin Training'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {isBuildingKB && <TaskRunner tasks={learningTasks} />}

                        {knowledgeBase && (
                            <div className="mt-6 border-t border-border-light dark:border-border-dark pt-4">
                                <button onClick={() => setIsKbExpanded(!isKbExpanded)} className="flex justify-between items-center w-full font-semibold">
                                    <span>View Learned Knowledge</span>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isKbExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isKbExpanded && (
                                    <div className="mt-4 p-4 bg-slate-50 dark:bg-surface-dark/60 rounded-lg max-h-80 overflow-y-auto prose prose-sm dark:prose-invert">
                                        <MarkdownContent content={knowledgeBase.content} />
                                    </div>
                                )}
                                <div className="text-right mt-4">
                                     <button onClick={() => handleClearKnowledgeBase()} className="text-xs text-danger hover:underline">
                                        Clear Knowledge Base
                                    </button>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="flex flex-col h-[calc(100vh-220px)]">
                        {error && <div className="bg-red-100 border-l-4 border-danger text-red-700 dark:bg-red-900/50 dark:text-red-300 p-4 mb-4 rounded-md text-sm">{error}</div>}

                        <div className="flex-grow overflow-hidden flex flex-col">
                            {chatHistory.length === 0 && !loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-surface-dark/60 rounded-lg">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                                            <span className="text-white text-4xl">🔎</span>
                                    </div>
                                    <h3 className="text-lg font-semibold font-heading">Ask Anything</h3>
                                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1 max-w-sm">
                                        e.g., "What are the top 3 marketing trends on TikTok?" or "How do I calculate customer lifetime value?"
                                    </p>
                                </div>
                            ) : (
                                <div ref={chatContainerRef} className="h-full space-y-4 overflow-y-auto pr-4 -mr-4">
                                    {chatHistory.map((msg, i) => (
                                        <ChatMessage
                                            key={msg.id || i}
                                            message={msg}
                                            isBeingSpoken={speakingMessageId === msg.id}
                                            onStopSpeaking={handleStopSpeaking}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-shrink-0 mt-6 pt-4" data-tour-id="advisor-chat-input">
                             <div className="relative">
                                <Input
                                    id="query"
                                    label="Your Question"
                                    type="textarea"
                                    value={query}
                                    onChange={(_, val) => setQuery(val)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isListening ? "Listening..." : "Type or click the mic to speak..."}
                                />
                                <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
                                    <button
                                        onClick={handleToggleListening}
                                        disabled={!recognitionRef.current || loading}
                                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'}`}
                                        aria-label={isListening ? 'Stop listening' : 'Start listening'}
                                    >
                                        <MicrophoneIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={loading || !query.trim()}
                                        className="text-white font-bold p-2 rounded-lg bg-primary hover:bg-primary-hover transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Send message"
                                    >
                                       {loading ? <div className="w-5 h-5 border-2 border-gray-200 border-t-white rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card>
                         <div className="flex flex-col sm:flex-row items-center gap-6">
                             <div className="flex-grow w-full">
                                <h2 className="text-xl font-bold font-heading">Yugn AI Memory Management</h2>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1">
                                    Clearing memory will reset all projects and the AI's learned knowledge base. This action cannot be undone.
                                </p>
                             </div>
                             <button onClick={handleClearMemory} className="w-full sm:w-auto flex-shrink-0 text-white font-bold py-3 px-6 rounded-xl bg-danger hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                                Clear All Data
                            </button>
                         </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default AIAdvisor;
