import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StrategyIcon, AssetsIcon, ContentIcon, CampaignIcon, SeoIcon, AdvisorIcon, PlannerIcon } from './icons/TabIcons';
import { DashboardIcon } from './icons/DashboardIcon';
import { FlaskIcon } from './icons/FlaskIcon';
import TaskRunner from './TaskRunner';
import type { Task } from '../types';
import ScoreDonut from './charts/ScoreDonut';
import { MarkdownContent } from '../components/Chat/MarkdownContent';

const BlinkingCursor = () => <span className="inline-block w-2 h-4 bg-primary dark:bg-slate-200 animate-pulse ml-0.5" />;

// --- Individual Slide Components ---

const DashboardSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (isActive) {
            const timer = setTimeout(() => setProgress(65), 500);
            return () => clearTimeout(timer);
        } else {
            setProgress(0);
        }
    }, [isActive]);

    return (
        <div className="h-full p-2 md:p-3 flex flex-col gap-2 md:gap-3">
            <h4 className="font-bold text-sm md:text-base text-primary-text-light dark:text-primary-text-dark flex-shrink-0 px-2">Project Dashboard</h4>
            <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-2 md:gap-3">
                <div className="p-2 md:p-4 rounded-lg bg-slate-100 dark:bg-surface-dark/60 flex flex-col justify-center items-center">
                    <h5 className="font-semibold text-xs text-center mb-2">Budget Allocation</h5>
                    <div className="relative w-16 h-16 md:w-24 md:h-24">
                        <svg viewBox="0 0 36 36" className="w-full h-full">
                            <path className="text-slate-200 dark:text-slate-700" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-primary" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-secondary" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="30, 100" strokeDashoffset="-60" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                    </div>
                </div>
                <div className="p-2 md:p-4 rounded-lg bg-slate-100 dark:bg-surface-dark/60">
                    <h5 className="font-semibold text-xs mb-2">Campaign Progress</h5>
                    <p className="font-bold text-2xl text-primary">{progress}%</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%`, transition: 'width 1s ease-out' }}></div>
                    </div>
                    <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark mt-1">{Math.round(20 * (progress/100))} of 20 tasks done</p>
                </div>
                <div className="p-2 md:p-4 rounded-lg bg-slate-100 dark:bg-surface-dark/60">
                    <h5 className="font-semibold text-xs mb-1">Top Persona</h5>
                    <p className="font-bold text-sm">Eco-conscious Millennial</p>
                    <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark">Pain Points: Sustainability, Quality, Brand Story</p>
                </div>
                 <div className={`p-2 md:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/40 transition-all duration-500 delay-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h5 className="font-semibold text-xs mb-1 text-blue-800 dark:text-blue-200">Proactive Advice</h5>
                    <p className="text-xs text-blue-700 dark:text-blue-300">"Consider A/B testing your main headline to improve CTR on Instagram."</p>
                </div>
            </div>
        </div>
    );
};

const ResonanceLabSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const scores = [
        { score: 8.2, feedback: "Good, but a bit generic." },
        { score: 5.5, feedback: "Doesn't connect with my pain points." },
        { score: 9.1, feedback: "This speaks directly to me!" },
    ];
    return (
        <div className="h-full p-2 md:p-3 flex flex-col gap-2 md:gap-3">
            <h4 className="font-bold text-sm md:text-base text-primary-text-light dark:text-primary-text-dark flex-shrink-0 px-2">AI Resonance Lab</h4>
            <div className="flex-grow grid grid-cols-3 gap-2 md:gap-3">
                {['Benefit-focused', 'Story-driven', 'Urgency-focused'].map((theme, i) => (
                    <div key={theme} className={`p-2 rounded-lg flex flex-col items-center justify-start text-center transition-all duration-300 ${scores[i].score > 9 ? 'bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-500' : 'bg-slate-100 dark:bg-surface-dark/60'}`}>
                        <h5 className="font-semibold text-xs">{theme}</h5>
                        <div className={`transition-all duration-500 ease-out delay-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                            <ScoreDonut score={Math.round(scores[i].score * 10)} size="small" />
                        </div>
                        <p className={`text-center text-xs text-secondary-text-light dark:text-secondary-text-dark mt-2 transition-opacity duration-500 delay-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                            <em>"{scores[i].feedback}"</em>
                        </p>
                         {scores[i].score > 9 && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300 mt-1 animate-fade-in delay-1000">🏆 Winner</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const PlannerSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const calendarItems = [
        { topic: "Blog: The Art of Watchmaking", status: 'Done' as const },
        { topic: "Instagram: Behind the Scenes", status: 'In Progress' as const },
        { topic: "LinkedIn Ad: New Collection", status: 'To Do' as const },
        { topic: "Facebook Post: User-Generated Content", status: 'To Do' as const },
    ];
    return (
        <div className="h-full p-2 md:p-3 flex flex-col gap-2 md:gap-3">
            <h4 className="font-bold text-sm md:text-base text-primary-text-light dark:text-primary-text-dark flex-shrink-0 px-2">Content Planner</h4>
            <div className="flex-grow space-y-2">
                {calendarItems.map((item, i) => (
                    <div key={i} className={`p-2 rounded-lg bg-slate-100 dark:bg-surface-dark/60 flex items-center gap-3 transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{transitionDelay: `${i*200}ms`}}>
                        <p className="text-xs font-semibold flex-grow">{item.topic}</p>
                        <span className={`text-xs font-semibold py-1 px-2 rounded-md ${
                            item.status === 'Done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' :
                            item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                            'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>{item.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StrategySlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const [stage, setStage] = useState<'input' | 'processing' | 'result'>('input');
    const [tasks, setTasks] = useState<Task[]>([
        { name: "Competitive Analysis", status: 'pending' },
        { name: "Audience Persona Generation", status: 'pending' },
        { name: "Final Synthesis & Review", status: 'pending' },
    ]);
    const [displayedName, setDisplayedName] = useState('');
    const finalName = "Aethel Watches";

    useEffect(() => {
        if (!isActive) return;

        const resetAnimation = () => {
            setStage('input');
            setDisplayedName('');
            setTasks(p => p.map(t => ({ ...t, status: 'pending' })));

            let charIndex = 0;
            const typingTimer = setInterval(() => {
                setDisplayedName(prev => finalName.substring(0, prev.length + 1));
                charIndex++;
                if (charIndex >= finalName.length) clearInterval(typingTimer);
            }, 100);

            const processingTimer = setTimeout(() => setStage('processing'), 2500);
            
            let currentTask = -1;
            const taskInterval = setInterval(() => {
                 currentTask++;
                 if (currentTask < tasks.length) {
                    setTasks(prev => prev.map((t, i) => i === currentTask ? { ...t, status: 'complete' } : t));
                 } else {
                     clearInterval(taskInterval);
                     const resultTimer = setTimeout(() => setStage('result'), 800);
                     return () => clearTimeout(resultTimer);
                 }
            }, 800);

            return () => {
                clearInterval(typingTimer);
                clearTimeout(processingTimer);
                clearInterval(taskInterval);
            };
        };

        resetAnimation();
    }, [isActive, tasks.length]);

    const InputField: React.FC<{label: string, value: React.ReactNode}> = ({label, value}) => (
        <div>
            <label className="text-xs font-medium text-primary-text-light dark:text-primary-text-dark">{label}</label>
            <div className="text-sm p-2 bg-slate-200 dark:bg-slate-700 rounded-md mt-1 font-mono h-8 flex items-center truncate">
                {value}
            </div>
        </div>
    );

    return (
        <div className="flex h-full p-2 md:p-3 gap-2 md:gap-3">
            <div className="w-1/2 bg-slate-100 dark:bg-slate-900/50 p-2 md:p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-xs mb-2 text-secondary-text-light dark:text-secondary-text-dark">Configuration</h4>
                <InputField label="Business Name" value={<>{displayedName}{stage === 'input' && <BlinkingCursor />}</>} />
                <InputField label="Industry" value="Luxury Goods" />
                <InputField label="Products" value="Sustainable timepieces" />
            </div>
            <div className="w-1/2 p-2 md:p-4 relative">
                <div className={`absolute inset-2 md:inset-4 flex items-center justify-center transition-all duration-500 ${stage === 'processing' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <TaskRunner tasks={tasks} />
                </div>
                <div className={`absolute inset-2 md:inset-4 flex items-center justify-center transition-all duration-500 delay-200 ${stage === 'result' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 border border-border-light dark:border-border-dark rounded-xl w-full max-w-xs shadow-md space-y-2">
                        <div>
                            <h5 className="font-bold font-heading text-xs text-primary">Target Persona</h5>
                            <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-md mt-1">
                                <p className="font-semibold text-xs">Eco-conscious Millennial (28-40)</p>
                                <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark">Pain Points: Sustainability, Quality</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-xs bg-slate-300 dark:bg-slate-600 rounded-full px-2">Instagram</span>
                                    <span className="text-xs bg-slate-300 dark:bg-slate-600 rounded-full px-2">Pinterest</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-bold font-heading text-xs text-primary">Key KPIs</h5>
                            <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark bg-slate-200 dark:bg-slate-700 p-1.5 rounded-md mt-1">ROAS, CPL, Engagement Rate</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AssetSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!isActive) {
            setShowAnalysis(false);
            setShowSuggestions(false);
            return;
        }
        const timer1 = setTimeout(() => setShowAnalysis(true), 1000);
        const timer2 = setTimeout(() => setShowSuggestions(true), 2500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, [isActive]);
    
    const ratingClasses: { [key: string]: string } = {
        Excellent: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300 border-green-500/30',
        Good: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300 border-blue-500/30',
    };

    const AdCreative: React.FC<{
        title: string;
        imageUrl: string;
        rating: 'Excellent' | 'Good';
        feedback: string;
        showSuggestions?: boolean;
    }> = ({ title, imageUrl, rating, feedback, showSuggestions: shouldShowSuggestions }) => (
        <div className="w-1/2 flex flex-col gap-2">
            <p className="text-xs font-bold text-center text-secondary-text-light dark:text-secondary-text-dark">{title}</p>
            <div className="relative w-full aspect-[9/16] bg-slate-800 rounded-lg overflow-hidden shadow-lg">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
            <div className={`p-2 rounded-lg transition-all duration-500 ease-out ${showAnalysis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${ratingClasses[rating]}`}>
                    {rating}
                </span>
                <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark mt-1">{feedback}</p>
                {shouldShowSuggestions && (
                    <div className={`mt-2 transition-all duration-500 ${shouldShowSuggestions ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0'} overflow-hidden`}>
                        <h6 className="text-xs font-bold mb-1">Improvement Ideas:</h6>
                        <ul className="text-xs list-disc pl-4 space-y-1 text-secondary-text-light dark:text-secondary-text-dark">
                            <li>Add a human element (e.g., on a wrist).</li>
                            <li>Increase contrast to make it pop.</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex h-full p-2 md:p-3 items-start justify-center gap-2 md:gap-4">
            <AdCreative
                title="Smartphone Product Shot"
                imageUrl="https://images.unsplash.com/photo-1587370335343-7f7228a1a357?q=80&w=400&h=711&auto=format&fit=crop"
                rating="Good"
                feedback="Clear product focus, but lacks context and emotional connection."
                showSuggestions={showSuggestions}
            />
            <AdCreative
                title="Smartphone Lifestyle Shot"
                imageUrl="https://images.unsplash.com/photo-1598327105666-6d364316a3a8?q=80&w=400&h=711&auto=format&fit=crop"
                rating="Excellent"
                feedback="Strong lifestyle context, clear branding, and a compelling call-to-action."
            />
        </div>
    );
};

const CampaignSlide: React.FC<{isActive: boolean}> = ({isActive}) => {
    const data = [
      { name: 'Instagram', roas: 4.5 },
      { name: 'LinkedIn', roas: 3.2 },
      { name: 'Pinterest', roas: 3.8 },
    ];
    return (
    <div className="h-full p-2 md:p-3 flex items-center justify-center gap-2 md:gap-4">
        <div className="w-2/3 p-2 md:p-4 rounded-lg bg-slate-100 dark:bg-surface-dark/60 h-full flex flex-col">
            <h4 className="font-bold text-sm md:text-base mb-2 text-primary-text-light dark:text-primary-text-dark flex-shrink-0">Campaign ROAS (Return On Ad Spend)</h4>
            <div className="flex-grow flex items-end gap-2 md:gap-4 px-1 md:px-2">
                {data.map((d, i) => (
                    <div key={d.name} className="flex-1 h-full flex flex-col justify-end items-center">
                        <div className={`w-full bg-primary/80 rounded-t-md hover:bg-primary transition-all duration-300 ${isActive ? 'animate-fade-in-up' : ''}`} style={{ height: `${d.roas * 15}%`, animationDelay: `${i * 150}ms` }} title={`ROAS: ${d.roas}x`}></div>
                        <p className="text-xs font-semibold mt-1 text-secondary-text-light dark:text-secondary-text-dark">{d.name}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className={`w-1/3 h-full flex flex-col justify-center transition-all duration-500 delay-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <div className="p-2 md:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-500">
                <h5 className="font-semibold text-xs text-blue-800 dark:text-blue-200">AI Optimization</h5>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">"LinkedIn ROAS is low. Consider refining audience targeting to specific job titles."</p>
            </div>
        </div>
    </div>
)};

const ContentSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const finalContent = "**Timeless Design, Modern Values.**\n\nThe Aethel Mark IV is more than a watch—it's a statement. Crafted from recycled stainless steel and powered by a solar movement, it's luxury you can feel good about.\n\n🌿 #SustainableLuxury #AethelWatches";
    
    useEffect(() => {
        if (!isActive) {
            setDisplayedContent('');
            return;
        }
        let charIndex = 0;
        const typingInterval = setInterval(() => {
            if (charIndex < finalContent.length) {
                setDisplayedContent(finalContent.substring(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(typingInterval);
            }
        }, 30);
        return () => clearInterval(typingInterval);
    }, [isActive]);

    return (
        <div className="p-2 md:p-3 h-full">
            <div className="p-3 md:p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 h-full flex gap-3 md:gap-4">
                <div className="w-1/3 flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1620625515032-6ed0c147223b?q=80&w=400&h=711&auto=format&fit=crop" alt="Watch" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-xs mb-2 text-secondary-text-light dark:text-secondary-text-dark">Generated Instagram Post</h4>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base text-primary-text-light dark:text-primary-text-dark">
                        <MarkdownContent content={displayedContent} />
                        {isActive && displayedContent.length < finalContent.length && <BlinkingCursor />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SeoSlide: React.FC<{isActive: boolean}> = ({isActive}) => {
    const actions = [
        { rec: 'Add "sustainable" to the homepage title tag', impact: 'High' as const, effort: 'Easy' as const },
        { rec: 'Fix 3 broken internal links', impact: 'Medium' as const, effort: 'Easy' as const },
        { rec: 'Compress images to improve page speed', impact: 'High' as const, effort: 'Medium' as const },
    ];
    return (
        <div className="p-2 md:p-3 h-full flex flex-col">
            <h4 className="font-bold text-sm md:text-base text-primary-text-light dark:text-primary-text-dark flex-shrink-0 px-2 mb-2">SEO Action Plan</h4>
            <div className="space-y-2">
                {actions.map((action, i) => (
                    <div key={i} className={`p-2 rounded-lg bg-slate-100 dark:bg-surface-dark/60 transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{transitionDelay: `${i*200}ms`}}>
                        <p className="text-xs font-semibold">{action.rec}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">{action.impact} Impact</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">{action.effort} Effort</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdvisorSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setStage(0);
            return;
        };
        const timers = [
            setTimeout(() => setStage(1), 500),
            setTimeout(() => setStage(2), 2000),
            setTimeout(() => setStage(3), 3500),
        ];
        return () => timers.forEach(clearTimeout);
    }, [isActive]);
    
    return (
        <div className="p-2 md:p-3 h-full flex flex-col justify-center gap-2">
            <div className={`flex justify-end transition-all duration-500 ${stage >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                <p className="bg-primary text-white p-2 rounded-lg text-xs md:text-sm max-w-[75%]">What's the best ad format for luxury brands on Instagram?</p>
            </div>
             <div className={`flex justify-start transition-all duration-500 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                {stage === 2 ? (
                    <div className="bg-slate-200 dark:bg-surface-dark rounded-lg p-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    </div>
                ) : stage >= 3 ? (
                    <div className="bg-slate-200 dark:bg-surface-dark p-2 rounded-lg text-xs md:text-sm max-w-[75%] animate-fade-in-up">
                        <p>For luxury, **Carousels** and **Reels** are top performers. Carousels allow for storytelling, while Reels tap into immersive, video-first experiences.</p>
                        <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">
                            <p className="text-xs font-bold text-secondary-text-light dark:text-secondary-text-dark">Source: Meta for Business</p>
                        </div>
                    </div>
                ) : null}
             </div>
        </div>
    );
};

const features = [
    { id: 'dashboard', name: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" />, slide: DashboardSlide },
    { id: 'strategy', name: 'Strategy', icon: <StrategyIcon className="w-5 h-5" />, slide: StrategySlide },
    { id: 'lab', name: 'Resonance Lab', icon: <FlaskIcon className="w-5 h-5" />, slide: ResonanceLabSlide },
    { id: 'planner', name: 'Planner', icon: <PlannerIcon className="w-5 h-5" />, slide: PlannerSlide },
    { id: 'assets', name: 'Assets', icon: <AssetsIcon className="w-5 h-5" />, slide: AssetSlide },
    { id: 'campaigns', name: 'Campaigns', icon: <CampaignIcon className="w-5 h-5" />, slide: CampaignSlide },
    { id: 'content', name: 'Content', icon: <ContentIcon className="w-5 h-5" />, slide: ContentSlide },
    { id: 'seo', name: 'SEO', icon: <SeoIcon className="w-5 h-5" />, slide: SeoSlide },
    { id: 'advisor', name: 'Advisor', icon: <AdvisorIcon className="w-5 h-5" />, slide: AdvisorSlide },
];

const LiveDemo: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const resetInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!isPaused) {
            intervalRef.current = window.setInterval(() => {
                setActiveIndex(prev => (prev + 1) % features.length);
            }, 7000);
        }
    }, [isPaused]);

    useEffect(() => {
        resetInterval();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [activeIndex, isPaused, resetInterval]);

    const handleTabClick = (index: number) => {
        setActiveIndex(index);
    };
    
    return (
        <div 
            className="h-full w-full bg-surface-light dark:bg-dark border border-border-light dark:border-border-dark rounded-2xl flex flex-col font-sans text-sm overflow-hidden shadow-2xl shadow-primary/10"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Browser Header */}
            <div className="flex-shrink-0 h-9 bg-slate-100 dark:bg-slate-800/50 flex items-center px-3 gap-1.5 border-b border-border-light dark:border-border-dark">
                <div className="w-3 h-3 rounded-full bg-danger/80"></div>
                <div className="w-3 h-3 rounded-full bg-warning/80"></div>
                <div className="w-3 h-3 rounded-full bg-success/80"></div>
            </div>

            {/* Browser Body */}
            <div className="flex-grow flex h-full overflow-hidden">
                {/* Sidebar */}
                <div className="w-12 md:w-32 bg-slate-50 dark:bg-surface-dark/50 p-2 border-r border-border-light dark:border-border-dark flex flex-col gap-1.5 transition-all duration-300">
                    {features.map((feature, index) => (
                        <button 
                            key={feature.id} 
                            onClick={() => handleTabClick(index)} 
                            className={`w-full flex items-center justify-center md:justify-start gap-2 p-2 rounded-md text-xs font-semibold transition-all group relative ${activeIndex === index ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'text-secondary-text-light dark:text-secondary-text-dark hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        >
                            <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200 ${activeIndex === index ? 'bg-primary' : 'bg-transparent -translate-x-1 group-hover:translate-x-0 group-hover:bg-primary/50'}`}></span>
                            {feature.icon}
                            <span className="hidden md:block">{feature.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-grow relative bg-slate-100 dark:bg-surface-dark/20">
                    {features.map((feature, index) => (
                        <div key={feature.id} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${activeIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                            {<feature.slide isActive={index === activeIndex} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex-shrink-0 h-1.5 w-full bg-slate-200 dark:bg-slate-700">
                <div key={activeIndex} className={`h-full bg-primary ${!isPaused ? 'animate-progress-fill' : ''}`}></div>
            </div>
        </div>
    );
};

export default LiveDemo;
