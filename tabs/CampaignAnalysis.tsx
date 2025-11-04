

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { OptimizationSuggestion, CampaignForecast, ChatMessage as ChatMessageType, AbTestSuggestion, PredictedMetrics } from '../types';
import { generateCampaignOptimizations, generateCampaignForecast, generateAbTestIdeas } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Input from '../components/Input';
import { PlugIcon } from '../components/icons/PlugIcon';
import ChatMessage from '../components/Chat/ChatMessage';
import { SendIcon } from '../components/icons/SendIcon';
import ForecastChart from '../components/charts/ForecastChart';
import { CogIcon } from '../components/icons/CogIcon';
import { CampaignIcon } from '../components/icons/TabIcons';
import { CrossIcon } from '../components/icons/CrossIcon';
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

const formatSuggestions = (suggestions: OptimizationSuggestion[]): string => {
  if (!suggestions || suggestions.length === 0) {
    return "I couldn't find any specific optimizations based on this image. Try providing a screenshot with more data or adding more context about your goals.";
  }
  return suggestions
    .map(opt => `**Platform: ${opt.platform} (Impact: ${opt.impact})**\n- ${opt.suggestion}`)
    .join('\n\n');
};

const CampaignAnalysis: React.FC = () => {
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [forecast, setForecast] = useState<CampaignForecast | null>(null);
    const [loadingState, setLoadingState] = useState<'idle' | 'analyzing' | 'forecasting'>('idle');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [userContext, setUserContext] = useState<string>('');
    const [chatMessage, setChatMessage] = useState<string>('');
    const { openIntegrationsModal, isSidebarOpen, setIsSidebarOpen } = useAppContext();
    const { addToast } = useToast();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [ariaLiveMessage, setAriaLiveMessage] = useState('');
    const [abTestIdeas, setAbTestIdeas] = useState<{ [platform: string]: AbTestSuggestion[] }>({});
    const [generatingTestFor, setGeneratingTestFor] = useState<string | null>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [chatHistory]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            setImageFiles(fileArray);

            const previewPromises = fileArray.map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    // FIX: Explicitly cast `file` to `Blob` to satisfy `readAsDataURL`'s parameter type,
                    // resolving a type inference issue.
                    reader.readAsDataURL(file as Blob);
                });
            });

            Promise.all(previewPromises).then(previews => {
                setImagePreviews(previews);
            });

            setChatHistory([]); // Clear previous results
            setForecast(null);
            setAbTestIdeas({});
        }
    };

    const handleAnalyze = useCallback(async (feedbackToProvide?: string) => {
        if (imageFiles.length === 0) {
            addToast('Please upload one or more screenshots of your campaign performance.', 'error');
            return;
        }

        setLoadingState('analyzing');
        
        try {
            const imagePayloads = await Promise.all(
                imageFiles.map(async (file: File) => ({
                    mimeType: file.type,
                    data: await fileToBase64(file),
                }))
            );

            const results = await generateCampaignOptimizations(imagePayloads, userContext, feedbackToProvide);
            const formattedText = formatSuggestions(results);
            
            const newAiMessage: ChatMessageType = { sender: 'ai', text: formattedText };

            if (feedbackToProvide) {
                setChatHistory(prev => [...prev.slice(0, -1), newAiMessage]);
            } else {
                setChatHistory([newAiMessage]);
            }
            setChatMessage('');
            setAriaLiveMessage('Yugn AI optimization suggestions have been generated.');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
            addToast(errorMessage, 'error');
            setAriaLiveMessage('An error occurred during analysis.');
            if (feedbackToProvide) {
                setChatHistory(prev => prev.slice(0, -1));
            }
        } finally {
            setLoadingState('idle');
        }
    }, [imageFiles, userContext, addToast]);

    const handleForecast = useCallback(async () => {
        if (imageFiles.length === 0) {
            addToast('Please upload one or more screenshots to generate a forecast.', 'error');
            return;
        }
        setLoadingState('forecasting');
        setForecast(null);
        setAbTestIdeas({});

        try {
            const imagePayloads = await Promise.all(
                imageFiles.map(async (file: File) => ({
                    mimeType: file.type,
                    data: await fileToBase64(file),
                }))
            );
            const results = await generateCampaignForecast(imagePayloads, userContext);
            setForecast(results);
            setAriaLiveMessage('Campaign forecast has been generated.');
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'An unknown error occurred during forecast generation.', 'error');
            setAriaLiveMessage('An error occurred during forecast generation.');
        } finally {
            setLoadingState('idle');
        }
    }, [imageFiles, userContext, addToast]);
    

    const handleGenerateAbTests = async (metrics: PredictedMetrics) => {
        if (imageFiles.length === 0) {
            addToast('Please upload a screenshot first.', 'error');
            return;
        }
        setGeneratingTestFor(metrics.platform);
        try {
            const imagePayloads = await Promise.all(
                imageFiles.map(async (file: File) => ({
                    mimeType: file.type,
                    data: await fileToBase64(file),
                }))
            );
            const results = await generateAbTestIdeas(imagePayloads, metrics.platform, metrics, userContext);
            setAbTestIdeas(prev => ({ ...prev, [metrics.platform]: results }));
            setAriaLiveMessage(`A/B test ideas generated for ${metrics.platform}.`);
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Failed to generate A/B test ideas.', 'error');
            setAriaLiveMessage(`Error generating A/B test ideas for ${metrics.platform}.`);
        } finally {
            setGeneratingTestFor(null);
        }
    };

    const handleSendMessage = () => {
        if (chatMessage.trim() && loadingState === 'idle') {
            setChatHistory(prev => [...prev, 
                { sender: 'user', text: chatMessage },
                { sender: 'ai', text: '', isLoading: true }
            ]);
            handleAnalyze(chatMessage);
        }
    };

    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

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
                        <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg flex items-center gap-4 border border-border-light dark:border-border-dark">
                            <PlugIcon className="w-8 h-8 text-primary flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold font-heading">Connect Your Platforms</h4>
                                <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">For real-time data, connect your ad accounts. Or, upload a screenshot below.</p>
                                 <button onClick={openIntegrationsModal} className="text-sm font-bold text-primary hover:underline mt-1">
                                    Connect now &rarr;
                                </button>
                            </div>
                        </div>

                        <div data-tour-id="campaign-upload">
                            <label className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark mb-1.5">
                                Upload Screenshot(s)
                            </label>
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                multiple
                                onChange={handleFileChange}
                                className="block w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/20 dark:file:text-primary dark:hover:file:bg-primary/30"
                            />
                        </div>
                        {imagePreviews.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark mb-2">
                                    {imagePreviews.length} image(s) selected:
                                </p>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {imagePreviews.map((preview, index) => (
                                        <img key={index} src={preview} alt={`Campaign preview ${index + 1}`} className="flex-shrink-0 rounded-lg h-28 w-auto border-2 border-border-light dark:border-border-dark shadow-md" />
                                    ))}
                                </div>
                            </div>
                        )}
                        <Input
                            id="userContext"
                            label="Analysis Context (Optional)"
                            type="textarea"
                            placeholder="e.g., 'My main goal is to lower the CPC...'"
                            value={userContext}
                            onChange={(_, val) => setUserContext(val)}
                        />
                    </div>
                    <div className="p-6 border-t border-border-light dark:border-border-dark grid sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-dark/50">
                         <button onClick={() => handleAnalyze()} disabled={loadingState !== 'idle' || imageFiles.length === 0} className="w-full text-white font-bold py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            {loadingState === 'analyzing' && chatHistory.length === 0 ? <><Spinner /> <span className="ml-3">Analyzing...</span></> : '🤖 Get Recs'}
                        </button>
                        <button onClick={handleForecast} disabled={loadingState !== 'idle' || imageFiles.length === 0} className="w-full text-white font-bold py-3 px-4 rounded-xl bg-gradient-to-r from-secondary to-primary hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            {loadingState === 'forecasting' ? <><Spinner /> <span className="ml-3">Forecasting...</span></> : '🔮 Forecast'}
                        </button>
                    </div>
                 </aside>
                <div className="flex-1 flex flex-col overflow-hidden">
                     <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-8">
                        <div className="max-w-4xl mx-auto">
                            <div aria-live="polite" className="sr-only">{ariaLiveMessage}</div>
                            {loadingState === 'idle' && chatHistory.length === 0 && !forecast && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                                        <CampaignIcon className="w-12 h-12 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-heading">Campaign Recommendations & Forecasts</h3>
                                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-md">Upload a campaign screenshot or connect a data source to get Yugn AI-powered tips and future performance predictions.</p>
                                </div>
                            )}

                            {loadingState !== 'idle' && chatHistory.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                                    <Spinner />
                                    <h3 className="text-xl font-semibold font-heading mt-4">Analyzing Campaign Data...</h3>
                                    <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1">Yugn AI is generating insights and forecasts.</p>
                                </div>
                            )}

                            {chatHistory.length > 0 && (
                                <Card className="animate-slide-in flex flex-col h-full max-h-[70vh]">
                                    <h2 className="text-2xl font-bold font-heading mb-4 flex-shrink-0">Yugn AI Optimization Chat</h2>
                                    <div ref={chatContainerRef} className="flex-grow space-y-4 overflow-y-auto pr-4 -mr-4">
                                        {chatHistory.map((msg, i) => (
                                            <ChatMessage key={i} message={msg} />
                                        ))}
                                    </div>
                                    <div className="mt-6 border-t border-border-light dark:border-border-dark pt-4 flex-shrink-0">
                                        <div className="relative">
                                            <Input
                                                id="chatMessage"
                                                label="Refine with Yugn AI Chat"
                                                placeholder="e.g., 'Focus more on the Google Ads campaign.'"
                                                value={chatMessage}
                                                onChange={(_, val) => setChatMessage(val)}
                                                onKeyDown={handleChatKeyDown}
                                            />
                                            <button 
                                                onClick={handleSendMessage} 
                                                disabled={!chatMessage || loadingState !== 'idle'}
                                                className="absolute right-2.5 bottom-2.5 text-white font-bold p-2 rounded-lg bg-primary hover:bg-primary-hover transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Send message"
                                            >
                                                <SendIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {forecast && (
                                <Card className="animate-slide-in mt-8">
                                    <h2 className="text-2xl font-bold font-heading mb-6">🔮 Next Month Forecast</h2>
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">{forecast.forecastSummary}</p>
                                    </div>
                                    <ForecastChart forecast={forecast} />
                                     <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark">
                                        <h3 className="text-xl font-bold font-heading mb-4">A/B Test Ideas</h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {forecast.predictedMetrics.map(metrics => (
                                                <div key={metrics.platform} className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
                                                    <h4 className="font-bold text-primary mb-3">{metrics.platform}</h4>
                                                    {abTestIdeas[metrics.platform] ? (
                                                        <div className="space-y-3">
                                                            {abTestIdeas[metrics.platform].map((idea, i) => (
                                                                <div key={i} className="bg-surface-light dark:bg-surface-dark p-3 rounded-md text-sm">
                                                                    <p><strong>Hypothesis:</strong> {idea.hypothesis}</p>
                                                                    <p className="text-xs mt-1"><strong>Metric to Watch:</strong> {idea.metricToWatch}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleGenerateAbTests(metrics)}
                                                            disabled={generatingTestFor === metrics.platform}
                                                            className="w-full text-sm font-semibold py-2 px-3 rounded-lg border-2 border-secondary text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                                                        >
                                                            {generatingTestFor === metrics.platform ? <><Spinner size="small" /> Generating...</> : '💡 Get Test Ideas'}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CampaignAnalysis;
