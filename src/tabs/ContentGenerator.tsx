
import React, { useState, useRef, useEffect } from 'react';
import type { ContentGenerationParams, ChatMessage as ChatMessageType } from '../types';
import { generatePostContent } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Input from '../components/Input';
import ChatMessage from '../components/Chat/ChatMessage';
import { SendIcon } from '../components/icons/SendIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { ContentIcon } from '../components/icons/TabIcons';
import { CrossIcon } from '../components/icons/CrossIcon';

const ContentGenerator: React.FC = () => {
    const { getActiveProject, isSidebarOpen, setIsSidebarOpen, contentGeneratorPrefill, setContentGeneratorPrefill } = useAppContext();
    const { addToast } = useToast();

    const activeProject = getActiveProject();
    const strategy = activeProject?.strategy;
    const assets = activeProject?.assets || [];
    const businessData = activeProject?.businessData;

    const [params, setParams] = useState<ContentGenerationParams>({
        platform: 'linkedin',
        type: 'promotional',
        topic: '',
        tone: 'professional',
        keywords: '',
        assetId: '',
        personaName: '',
    });
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [loading, setLoading] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [ariaLiveMessage, setAriaLiveMessage] = useState('');

    useEffect(() => {
        if (contentGeneratorPrefill) {
            setParams(p => ({
                ...p,
                platform: contentGeneratorPrefill.platform || p.platform,
                type: contentGeneratorPrefill.type || p.type,
                topic: contentGeneratorPrefill.topic || p.topic,
            }));
            setContentGeneratorPrefill(null);
            addToast("Content details pre-filled from Planner!", 'info');
        }
    }, [contentGeneratorPrefill, setContentGeneratorPrefill, addToast]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [chatHistory]);

    const handleChange = (id: string, value: string) => {
        setParams({ ...params, [id]: value });
    };

    const useStrategyData = () => {
        if (!strategy) {
            addToast("Generate a strategy first in the Strategy Builder tab.", 'info');
            return;
        }
        setParams(p => ({
            ...p,
            topic: strategy.contentStrategy?.topics[0] || p.topic,
            keywords: strategy.contentStrategy?.hashtags?.map(h => h.replace('#', '')).join(', ') || p.keywords,
        }));
        addToast("Content ideas populated from your strategy!", 'success');
    };

    const handleGenerate = async () => {
        if (!params.topic) {
            addToast("Please enter a topic/product.", 'error');
            return;
        }
        if (params.type === 'ad-creative' && !params.personaName) {
            addToast("Please select a target persona for the Ad Creative.", 'error');
            return;
        }
        setLoading(true);
        setChatHistory([]);
        
        const selectedAsset = assets.find(a => a.id === params.assetId) || null;
        const projectKnowledgeBase = activeProject?.knowledgeBase;

        try {
            const content = await generatePostContent(params, selectedAsset, businessData, strategy, undefined, projectKnowledgeBase);
            setChatHistory([{ sender: 'ai', text: content }]);
            setAriaLiveMessage("Niti AI content has been generated.");
        } catch (err) {
            addToast(err instanceof Error ? err.message : "An unknown error occurred.", 'error');
            setAriaLiveMessage("An error occurred generating content.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateWithMessage = async (feedback: string) => {
        if (!feedback.trim() || loading) return;

        const userMessage: ChatMessageType = { sender: 'user', text: feedback };
        const loadingMessage: ChatMessageType = { sender: 'ai', text: '', isLoading: true };

        setChatHistory(prev => [...prev, userMessage, loadingMessage]);
        setChatMessage('');
        setLoading(true);

        const selectedAsset = assets.find(a => a.id === params.assetId) || null;
        const projectKnowledgeBase = activeProject?.knowledgeBase;


        try {
            const content = await generatePostContent(params, selectedAsset, businessData, strategy, feedback, projectKnowledgeBase);
            const newAiMessage: ChatMessageType = { sender: 'ai', text: content };
            setChatHistory(prev => [...prev.slice(0, -1), newAiMessage]);
        } catch (err) {
            addToast(err instanceof Error ? err.message : "An unknown error occurred.", 'error');
            setChatHistory(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateVariations = async () => {
        const latestAiMessage = [...chatHistory].reverse().find(m => m.sender === 'ai' && !m.isLoading);
        if (!latestAiMessage || loading) {
            addToast("Generate some content first before creating variations.", 'info');
            return;
        }
        
        handleRegenerateWithMessage("Generate three different variations of the previous post.");
    };

    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleRegenerateWithMessage(chatMessage);
        }
    };

    const handleCopy = () => {
        const latestAiMessage = [...chatHistory].reverse().find(m => m.sender === 'ai' && !m.isLoading);
        if (latestAiMessage) {
            navigator.clipboard.writeText(latestAiMessage.text);
            addToast('Content copied to clipboard!', 'success');
        }
    };
    
    const imageAssets = assets.filter(a => a.type === 'image');

    return (
        <>
            {/* Mobile Overlay */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${
                isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden="true"
            />
            <div className="flex h-full">
                <aside 
                    data-tour-id="content-config"
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
                        <Input label="Platform" id="platform" type="select" value={params.platform} onChange={handleChange}>
                            <option value="linkedin">LinkedIn</option>
                            <option value="facebook">Facebook</option>
                            <option value="instagram">Instagram</option>
                            <option value="twitter">Twitter/X</option>
                            <option value="blog">Blog Post</option>
                        </Input>
                        <Input label="Content Type" id="type" type="select" value={params.type} onChange={handleChange}>
                            <option value="promotional">Promotional Post</option>
                            <option value="educational">Educational Content</option>
                            <option value="engagement">Engagement Post</option>
                            <option value="ad-creative">Ad Creative</option>
                        </Input>
                        {params.type === 'ad-creative' && strategy?.targetPersonas && (
                            <Input label="Target Persona" id="personaName" type="select" value={params.personaName || ''} onChange={handleChange}>
                                <option value="">Select a persona...</option>
                                {strategy.targetPersonas.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                            </Input>
                        )}
                        <Input label="Topic / Product" id="topic" type="textarea" value={params.topic} onChange={handleChange} placeholder="e.g., Launch of our new summer collection" />
                        <Input label="Tone of Voice" id="tone" type="select" value={params.tone} onChange={handleChange}>
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="witty">Witty</option>
                            <option value="empathetic">Empathetic</option>
                            <option value="bold">Bold</option>
                        </Input>
                        <Input label="Keywords" id="keywords" value={params.keywords} onChange={handleChange} placeholder="e.g., sustainable fashion, summer style" />
                         {imageAssets.length > 0 && (
                            <Input label="Attach Image (Optional)" id="assetId" type="select" value={params.assetId || ''} onChange={handleChange}>
                                <option value="">No image</option>
                                {imageAssets.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.file.name}</option>
                                ))}
                            </Input>
                        )}
                        <div className="border-t border-border-light dark:border-border-dark pt-5">
                            <button onClick={useStrategyData} disabled={!strategy} className="w-full text-sm text-primary font-semibold py-2 px-3 rounded-lg border-2 border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Use My Strategy Data
                            </button>
                        </div>
                    </div>
                    <div className="p-6 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-dark/50">
                        <button onClick={handleGenerate} disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            {loading && chatHistory.length === 0 ? <><Spinner size="small" /><span className="ml-3">Generating...</span></> : '✨ Generate Content'}
                        </button>
                    </div>
                </aside>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <div aria-live="polite" className="sr-only">{ariaLiveMessage}</div>
                        <div className="max-w-4xl mx-auto">
                            {loading && chatHistory.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <Spinner size="large" />
                                    <h3 className="text-xl font-semibold font-heading mt-4">Niti AI is Writing...</h3>
                                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1">Crafting the perfect content based on your inputs.</p>
                                </div>
                            )}

                            {chatHistory.length > 0 ? (
                                <Card className="animate-slide-in flex flex-col h-full max-h-[70vh]">
                                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                        <h2 className="text-2xl font-bold font-heading">Niti AI Output</h2>
                                        <div className="flex gap-2">
                                            <button onClick={handleCopy} className="text-sm font-semibold py-2 px-3 rounded-lg border-2 border-secondary text-secondary hover:bg-secondary/10 transition-colors">Copy</button>
                                            <button onClick={handleGenerateVariations} className="text-sm font-semibold py-2 px-3 rounded-lg border-2 border-secondary text-secondary hover:bg-secondary/10 transition-colors">Variations</button>
                                        </div>
                                    </div>
                                    <div ref={chatContainerRef} className="flex-grow space-y-4 overflow-y-auto pr-4 -mr-4">
                                        {chatHistory.map((msg, i) => (
                                            <ChatMessage key={i} message={msg} />
                                        ))}
                                    </div>
                                    <div className="mt-6 border-t border-border-light dark:border-border-dark pt-4 flex-shrink-0">
                                        <div className="relative">
                                            <Input
                                                id="chatMessage"
                                                label="Refine with Niti AI Chat"
                                                type="textarea"
                                                placeholder="e.g., 'Make it shorter and add more emojis.'"
                                                value={chatMessage}
                                                onChange={(_, val) => setChatMessage(val)}
                                                onKeyDown={handleChatKeyDown}
                                            />
                                            <button 
                                                onClick={() => handleRegenerateWithMessage(chatMessage)} 
                                                disabled={!chatMessage || loading}
                                                className="absolute right-2.5 bottom-2.5 text-white font-bold p-2 rounded-lg bg-primary hover:bg-primary-hover transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Send message"
                                            >
                                                {loading ? <div className="w-5 h-5 border-2 border-gray-200 border-t-white rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                                        <ContentIcon className="w-12 h-12 text-white"/>
                                    </div>
                                    <h3 className="text-2xl font-bold font-heading">Welcome to the Content Generator</h3>
                                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">Configure your content parameters in the sidebar to generate compelling copy for any platform.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContentGenerator;
