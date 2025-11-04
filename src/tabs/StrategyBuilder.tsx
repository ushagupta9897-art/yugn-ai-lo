import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType, BudgetAnalysis, Task, PlatformStrategy, DiscoveredProduct, WebsiteAnalysisData, BusinessData } from '../types';
import { generateOrchestratedStrategy, analyzeBudgetAppropriateness, generateMarketingStrategy, explainPlatformChoice, discoverProductsFromWebsiteUrl, summarizeDiscoveredProduct, analyzeWebsiteForAnalysisData } from '../services/geminiService';
import { getCurrencySymbolForGeography, countryNames, getCurrencyCodeForGeography } from '../utils/currency';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import Input from '../components/Input';
import DeploymentGuide from '../components/DeploymentGuide';
import { SendIcon } from '../components/icons/SendIcon';
import ChatMessage from '../components/Chat/ChatMessage';
import Spinner from '../components/Spinner';
import TaskRunner from '../components/TaskRunner';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CrossIcon } from '../components/icons/CrossIcon';
import { PersonaCard } from '../components/PersonaCard';
import { MarkdownContent } from '../components/Chat/MarkdownContent';
import StrategicCoreCard from '../components/StrategicCoreCard';
import FinancialForecastCard from '../components/FinancialForecastCard';
import PhasedRolloutPlan from '../components/PhasedRolloutPlan';
import RiskOpportunityMatrix from '../components/RiskOpportunityMatrix';
import ProgressBar from '../components/ProgressBar';
import { LightbulbIcon } from '../components/icons/LightbulbIcon';

const industryGroups = [
  {
    label: "Technology",
    options: [
      "SaaS (Software as a Service)",
      "FinTech (Financial Technology)",
      "EdTech (Education Technology)",
      "HealthTech",
      "PropTech (Property Technology)",
      "Cybersecurity",
      "Artificial Intelligence & Machine Learning",
      "Cloud Computing",
      "Hardware & Consumer Electronics",
      "Gaming & eSports",
      "Telecommunications",
    ]
  },
  {
    label: "Retail & E-commerce",
    options: [
      "Fashion & Apparel",
      "Retail (Brick & Mortar)",
      "E-commerce",
      "Beauty & Cosmetics",
      "Home Goods & Furniture",
      "Consumer Packaged Goods (CPG)",
      "Luxury Goods",
      "Automotive Sales & Services",
    ]
  },
  {
    label: "Services",
    options: [
      "Professional Services (Legal, Accounting, Consulting)",
      "Marketing & Advertising Agency",
      "Creative Services (Design, Video Production)",
      "IT Services & Managed Service Providers (MSP)",
      "Financial Services (Banking, Insurance, Investment)",
      "Real Estate (Residential & Commercial)",
    ]
  },
  {
    label: "Health & Wellness",
    options: [
      "Healthcare Providers (Hospitals, Clinics)",
      "Pharmaceuticals & Biotech",
      "Medical Devices",
      "Mental Health & Wellness Apps",
      "Fitness & Gyms",
      "Nutrition & Supplements",
    ]
  },
  {
    label: "Hospitality & Entertainment",
    options: [
      "Travel & Tourism",
      "Hotels & Hospitality",
      "Restaurants, Food & Beverage",
      "Events & Entertainment",
      "Media & Publishing",
    ]
  },
  {
    label: "Other",
    options: [
      "Manufacturing & Industrial",
      "Construction",
      "Non-profit & Social Enterprise",
      "Energy & Utilities",
      "Agriculture",
      "Government & Public Sector",
    ]
  },
];


const businessModels = [
    "B2B (Business-to-Business)", "B2C (Business-to-Consumer)", "D2C (Direct-to-Consumer)",
    "Subscription", "Marketplace", "Freemium", "Affiliate", "Franchise", "Open Source"
];

const businessGoals = [
    "Increase Brand Awareness", "Generate Leads", "Drive Sales & Revenue",
    "Improve Customer Retention", "Launch a New Product", "Enter a New Market",
    "Increase Website Traffic", "Improve Customer Satisfaction"
];

const personalityTraits = ["Witty", "Authoritative", "Empathetic", "Formal", "Informal", "Playful"];

const ProductDiscoveryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    isLoadingProducts: boolean;
    isAnalyzingSite: boolean;
    isSummarizing: boolean;
    products: DiscoveredProduct[];
    productsError: string | null;
    onSelectProduct: (product: DiscoveredProduct) => void;
    analysisData: WebsiteAnalysisData | null;
    analysisError: string | null;
    onApplyAnalysis: (field: keyof BusinessData, value: string) => void;
}> = ({ 
    isOpen, onClose, isLoadingProducts, isAnalyzingSite, isSummarizing, products, productsError, onSelectProduct,
    analysisData, analysisError, onApplyAnalysis,
}) => {
    if (!isOpen) return null;

    const [selectedProduct, setSelectedProduct] = useState<DiscoveredProduct | null>(null);
    const { addToast } = useToast();
    
    // State for specific product link analysis
    const [specificProductUrl, setSpecificProductUrl] = useState('');
    const [isAnalyzingSpecificLink, setIsAnalyzingSpecificLink] = useState(false);

    useEffect(() => {
        setSelectedProduct(null);
    }, [products]);
    
    const handleApply = (field: keyof BusinessData, value: string) => {
        onApplyAnalysis(field, value);
        addToast(`'${field.replace(/([A-Z])/g, ' $1')}' has been auto-filled!`, 'success');
    }
    
    const handleAnalyzeSpecificLink = async () => {
        if (!specificProductUrl) {
            addToast("Please paste a product URL.", 'error');
            return;
        }
        setIsAnalyzingSpecificLink(true);
        try {
            const discovered = await discoverProductsFromWebsiteUrl(specificProductUrl);
            if (discovered && discovered.length > 0) {
                // Use the first product found on that specific page
                onSelectProduct(discovered[0]); 
            } else {
                addToast("Niti AI couldn't identify a specific product on that page.", 'info');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to analyze the product link.", 'error');
        } finally {
            setIsAnalyzingSpecificLink(false);
        }
    };

    const isLoading = isLoadingProducts || isAnalyzingSite;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog" aria-modal="true" aria-labelledby="discovery-title"
        >
            <div 
                className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 transform transition-all max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start flex-shrink-0">
                    <h2 id="discovery-title" className="text-2xl font-bold font-heading flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-primary"/>
                        AI Website Analysis
                    </h2>
                    <button onClick={onClose} className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary-text-light dark:hover:text-primary-text-dark text-2xl" aria-label="Close modal">&times;</button>
                </div>

                <div className="mt-6 min-h-[250px] flex-grow overflow-y-auto pr-2 -mr-4">
                    {isLoading && !isSummarizing && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <Spinner />
                            <p className="mt-3 font-semibold">Niti AI is analyzing the website...</p>
                            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">Discovering products & brand voice...</p>
                        </div>
                    )}
                    
                    {!isLoading && (
                        <div className="space-y-6">
                            {/* Products Section */}
                            <div>
                                <h3 className="font-bold mb-2">Discovered Products/Services</h3>
                                {productsError && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-xs text-red-700 dark:text-red-300 rounded-lg">{productsError}</div>}
                                {!productsError && products.length > 0 && (
                                    <div>
                                        <p className="mb-3 text-sm text-secondary-text-light dark:text-secondary-text-dark">Select a product or service to auto-fill the description.</p>
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                            {products.map((p, i) => (
                                                <button key={i} onClick={() => setSelectedProduct(p)} className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedProduct?.name === p.name ? 'border-primary bg-primary/10' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}>
                                                    <h4 className="font-bold text-sm">{p.name}</h4>
                                                    <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark mt-1">{p.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-3 text-right">
                                            <button 
                                                onClick={() => selectedProduct && onSelectProduct(selectedProduct)} 
                                                disabled={!selectedProduct || isLoading || isSummarizing} 
                                                className="px-4 py-2 text-xs text-white font-semibold rounded-lg bg-primary hover:bg-primary-hover transition-all shadow-md shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSummarizing ? <><Spinner size="small" /> Summarizing...</> : 'Auto-fill Description'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* New section for specific link analysis */}
                            <div className="border-t border-border-light dark:border-border-dark pt-6">
                                <h3 className="font-bold mb-2">Or, analyze a specific product page</h3>
                                <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mb-3">If your product isn't listed above, paste the direct URL to it here.</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-grow">
                                        <Input 
                                            id="specificProductUrl" 
                                            label="" 
                                            value={specificProductUrl} 
                                            onChange={(_, val) => setSpecificProductUrl(val)} 
                                            placeholder="https://example.com/product/specific-item"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAnalyzeSpecificLink} 
                                        disabled={isAnalyzingSpecificLink || isLoadingProducts || isAnalyzingSite}
                                        className="h-[50px] flex-shrink-0 text-white font-semibold rounded-lg bg-secondary hover:bg-indigo-700 transition-all shadow-md shadow-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4"
                                    >
                                        {isAnalyzingSpecificLink ? <Spinner size="small" /> : 'Analyze Link'}
                                    </button>
                                </div>
                            </div>
                            
                             {/* Insights Section */}
                            <div className="border-t border-border-light dark:border-border-dark pt-6">
                                <h3 className="font-bold mb-2">Content & Strategy Insights</h3>
                                {analysisError && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-xs text-red-700 dark:text-red-300 rounded-lg mt-4">{analysisError}</div>}
                                {analysisData && (
                                    <div className="space-y-3 mt-4 animate-fade-in">
                                        <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="font-semibold text-sm">Suggested Industry</h4>
                                                    <p className="text-sm mt-1">{analysisData.suggestedIndustry}</p>
                                                </div>
                                                <button onClick={() => handleApply('industry', analysisData.suggestedIndustry)} className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md px-3 py-1.5 transition-colors flex-shrink-0">Use</button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="font-semibold text-sm">Draft Brand Voice Sample</h4>
                                                    <p className="text-xs italic mt-1">{analysisData.brandVoiceSample}</p>
                                                </div>
                                                <button onClick={() => handleApply('brandVoiceSamples', analysisData.brandVoiceSample)} className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md px-3 py-1.5 transition-colors flex-shrink-0">Use</button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="font-semibold text-sm">Marketing Keywords Summary</h4>
                                                    <p className="text-xs italic mt-1">{analysisData.marketingKeywords}</p>
                                                </div>
                                                <button onClick={() => handleApply('currentMarketingStrategy', analysisData.marketingKeywords)} className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md px-3 py-1.5 transition-colors flex-shrink-0">Use</button>
                                            </div>
                                        </div>
                                        {analysisData.platformNuances && (
                                            <div className="p-3 bg-slate-50 dark:bg-surface-dark/60 rounded-lg">
                                                <div>
                                                    <h4 className="font-semibold text-sm">Platform Voice Nuances</h4>
                                                    <p className="text-xs italic mt-1">{analysisData.platformNuances}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-border-light dark:border-border-dark pt-4 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const BudgetSplitBar: React.FC<{ splits: { platformName: string; percentage: number }[] }> = ({ splits = [] }) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-teal-500', 'bg-indigo-500'];
    return (
        <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            {splits.map((split, index) => (
                <div
                    key={split.platformName}
                    className={`h-full ${colors[index % colors.length]}`}
                    style={{ width: `${split.percentage}%` }}
                    title={`${split.platformName}: ${split.percentage}%`}
                />
            ))}
        </div>
    );
};

const feedbackClasses = {
    Low: {
        container: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-300 dark:border-yellow-500/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: '💡'
    },
    Moderate: {
        container: 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30',
        text: 'text-blue-800 dark:text-blue-200',
        icon: '🤔'
    },
    Competitive: {
        container: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30',
        text: 'text-emerald-800 dark:text-emerald-200',
        icon: '✅'
    },
    High: {
        container: 'bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/30',
        text: 'text-green-800 dark:text-green-200',
        icon: '🚀'
    },
};

const PlatformCard: React.FC<{ 
    platform: PlatformStrategy;
    onExplain: () => void;
}> = ({ platform, onExplain }) => {
     const priorityClasses = {
        High: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    };
    return (
         <Card>
            <div className="flex justify-between items-start gap-3">
                <h4 className="text-lg font-bold font-heading">{platform.platformName}</h4>
                 <span className={`px-3 py-1 text-xs font-semibold rounded-full ${priorityClasses[platform.priority]}`}>{platform.priority} Priority</span>
            </div>
            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark italic mt-2 border-l-2 border-border-light dark:border-border-dark pl-3">
                {platform.justification}
            </p>
            <div className="mt-4">
                <button 
                    onClick={onExplain} 
                    disabled={platform.isExplaining}
                    className="w-full text-sm font-semibold py-2 px-3 rounded-lg border-2 border-secondary text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                    {platform.isExplaining ? (
                        <><Spinner size="small" /> Explaining...</>
                    ) : (
                        "🤔 Explain the 'Why'"
                    )}
                </button>
            </div>
            {platform.detailedJustification && (
                <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark animate-fade-in">
                    <MarkdownContent content={platform.detailedJustification} />
                </div>
            )}
        </Card>
    );
}

const AiInsight: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3 animate-fade-in-down relative">
        <LightbulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-200">{message}</p>
        <button onClick={onDismiss} className="absolute top-2 right-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100">
            <CrossIcon className="w-4 h-4" />
        </button>
    </div>
);


const StrategyBuilder: React.FC = () => {
    const { getActiveProject, updateActiveProjectData } = useAppContext();
    const { addToast } = useToast();
    
    const activeProject = getActiveProject();
    const businessData = activeProject?.businessData;
    const results = activeProject?.strategy;

    const [loading, setLoading] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [currencySymbol, setCurrencySymbol] = useState(() => getCurrencySymbolForGeography(businessData?.geography));
    const [ariaLiveMessage, setAriaLiveMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    const [budgetFeedback, setBudgetFeedback] = useState<BudgetAnalysis | null>(null);
    const [isAnalyzingBudget, setIsAnalyzingBudget] = useState(false);
    const budgetAnalysisTimeoutRef = useRef<number | null>(null);
    
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showGuidance, setShowGuidance] = useState(true);

    // --- New Wizard State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const insightTimeoutRef = useRef<number | null>(null);
    // --- End Wizard State ---

    // Website Analysis State
    const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [discoveredProducts, setDiscoveredProducts] = useState<DiscoveredProduct[]>([]);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [isAnalyzingSite, setIsAnalyzingSite] = useState(false);
    const [siteAnalysisData, setSiteAnalysisData] = useState<WebsiteAnalysisData | null>(null);
    const [siteAnalysisError, setSiteAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        const { budget, industry, businessGoals, geography, companySize } = businessData || {};
        if (budget && industry && businessGoals && geography && companySize) {
            setIsAnalyzingBudget(true);
            if (budgetAnalysisTimeoutRef.current) clearTimeout(budgetAnalysisTimeoutRef.current);
            budgetAnalysisTimeoutRef.current = window.setTimeout(async () => {
                try {
                    const currencyCode = getCurrencyCodeForGeography(geography);
                    const feedback = await analyzeBudgetAppropriateness({ budget, industry, goal: businessGoals, geography, currencyCode, companySize }, budgetFeedback);
                    setBudgetFeedback(feedback);
                } catch (err) {
                    console.error("Budget analysis failed:", err);
                    setBudgetFeedback(null);
                } finally { setIsAnalyzingBudget(false); }
            }, 1000);
        } else {
            if (budgetAnalysisTimeoutRef.current) clearTimeout(budgetAnalysisTimeoutRef.current);
            setIsAnalyzingBudget(false);
            setBudgetFeedback(null);
        }
        return () => { if (budgetAnalysisTimeoutRef.current) clearTimeout(budgetAnalysisTimeoutRef.current); };
    }, [businessData?.budget, businessData?.industry, businessData?.businessGoals, businessData?.geography, businessData?.companySize, budgetFeedback]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chatHistory]);

    useEffect(() => {
        if (businessData) {
            setCurrencySymbol(getCurrencySymbolForGeography(businessData.geography));
        }
    }, [businessData?.geography]);

    // Effect to show AI insights based on user input, without auto-advancing.
    useEffect(() => {
        if (insightTimeoutRef.current) clearTimeout(insightTimeoutRef.current);
        
        let insight: string | null = null;
        
        if (currentStep === 2 && businessData?.businessModel) {
            if (businessData.businessModel.includes('B2B')) insight = "B2B, got it. I'll focus on platforms like LinkedIn and professional targeting methods.";
            else if (businessData.businessModel.includes('B2C') || businessData.businessModel.includes('D2C')) insight = "Great, a consumer focus means I'll prioritize platforms like Meta and visually-driven content.";
        } else if (currentStep === 3 && businessData?.businessGoals) {
             if (businessData.businessGoals.includes('Leads')) insight = "For 'Lead Generation', I'll prioritize strategies with strong conversion mechanisms like lead forms.";
             else if (businessData.businessGoals.includes('Awareness')) insight = "To 'Increase Brand Awareness', I'll suggest broader targeting and high-impression channels.";
        }

        if (insight) {
            setAiInsight(insight);
            insightTimeoutRef.current = window.setTimeout(() => setAiInsight(null), 5000);
        }
    }, [businessData?.businessModel, businessData?.businessGoals, currentStep]);

    const handleChange = (id: string, value: string) => {
        if (!activeProject) return;
        const currentProject = getActiveProject();
        if (!currentProject) return;

        const updatedData = { ...currentProject.businessData, [id]: value };
        updateActiveProjectData({ businessData: updatedData });
    };

    const handleCheckboxChange = (trait: string) => {
        if (!activeProject) return;
        const currentTraits = activeProject.businessData.brandPersonalityTraits || [];
        const newTraits = currentTraits.includes(trait)
            ? currentTraits.filter(t => t !== trait)
            : [...currentTraits, trait];
        const updatedData = { ...activeProject.businessData, brandPersonalityTraits: newTraits };
        updateActiveProjectData({ businessData: updatedData });
    };

    const handleGenerateAnalysis = async () => {
        if (!businessData || !activeProject) return;
        const requiredFields = ['businessName', 'products', 'businessGoals', 'companySize', 'budget', 'productPricePoint'];
        const missingField = requiredFields.find(field => !businessData[field as keyof typeof businessData]);
        if (missingField) {
            const formattedFieldName = missingField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            addToast(`Please fill in the "${formattedFieldName}" field.`, 'error');
            return;
        }

        setLoading(true);
        setShowGuidance(true);
        setChatHistory([]);
        updateActiveProjectData({ strategy: null });
        setAriaLiveMessage('Niti AI has started generating your marketing strategy.');
        
        const dynamicInitialTasks: Task[] = [];
        if (businessData.websiteUrl) {
            dynamicInitialTasks.push({ name: "Website Content Analysis", status: 'pending', isOptional: true });
        }
         if (businessData.brandVoiceSamples || businessData.websiteUrl) {
            dynamicInitialTasks.push({ name: "Brand Voice DNA Analysis", status: 'pending' });
        }
        if (!businessData.industry) {
            dynamicInitialTasks.push({ name: "AI Industry Analysis", status: 'pending' });
        }
        dynamicInitialTasks.push(
            { name: "Research & Intelligence Gathering", status: 'pending' },
            { name: "Competitive SWOT Analysis", status: 'pending' },
            { name: "Generating Targeting Candidates", status: 'pending' },
            { name: "Scoring Candidates vs. Industry Data", status: 'pending' },
            { name: "Re-ranking for Budget & Goals", status: 'pending' },
            { name: "Forecasting & Phased Planning", status: 'pending' },
            { name: "Synthesizing Master Strategy", status: 'pending' }
        );
        setTasks(dynamicInitialTasks);

        try {
            const orchestrator = generateOrchestratedStrategy(businessData);
            for await (const update of orchestrator) {
                 setTasks(currentTasks => {
                    const taskNamesInOrder = dynamicInitialTasks.map(t => t.name);
                    const updateIndex = taskNamesInOrder.findIndex(name => name === update.task);
                    if (updateIndex === -1) return currentTasks;

                    return currentTasks.map((task) => {
                         const taskIndex = taskNamesInOrder.findIndex(name => name === task.name);
                        if (taskIndex < updateIndex) {
                            return { ...task, status: 'complete' };
                        }
                        if (task.name === update.task) {
                            return { ...task, status: update.status, isOptional: update.isOptional };
                        }
                        return task;
                    });
                });

                if (update.result) {
                    updateActiveProjectData({ strategy: update.result });
                    setAriaLiveMessage('Niti AI marketing strategy has been successfully generated.');
                    const initialAiMessage: ChatMessageType = { sender: 'ai', text: "Here is the initial marketing strategy. You can ask me to refine it using the chat below." };
                    setChatHistory([initialAiMessage]);
                }
            }
        } catch (err) {
            addToast(err instanceof Error ? err.message : "An unknown error occurred.", 'error');
            setAriaLiveMessage('An error occurred while generating the marketing strategy.');
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSendMessage = async () => {
        if (!chatMessage.trim() || loading || isChatLoading || !businessData || !results) return;

        const newUserMessage: ChatMessageType = { sender: 'user', text: chatMessage };
        const loadingMessage: ChatMessageType = { sender: 'ai', text: '', isLoading: true };

        setChatHistory(prev => [...prev, newUserMessage, loadingMessage]);
        setIsChatLoading(true);
        const feedback = chatMessage;
        setChatMessage('');

        try {
            const feedbackHistory = JSON.parse(localStorage.getItem('userFeedback') || '[]' );
            feedbackHistory.push(feedback);
            localStorage.setItem('userFeedback', JSON.stringify(feedbackHistory));

            const refinedStrategy = await generateMarketingStrategy(businessData, results, feedback);

            updateActiveProjectData({ strategy: refinedStrategy });
            const newAiMessage: ChatMessageType = { sender: 'ai', text: "I've updated the strategy based on your feedback. Take a look at the changes above. How else can I help?" };
            setChatHistory(prev => [...prev.slice(0, -1), newAiMessage]);

        } catch (e) {
            console.error("Failed to refine strategy:", e);
            addToast(e instanceof Error ? e.message : "Failed to refine strategy.", 'error');
            setChatHistory(prev => prev.slice(0, -1));
        } finally {
            setIsChatLoading(false);
        }
    };
    
     const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleExplainPlatform = async (platformName: string) => {
        const currentProject = getActiveProject();
        if (!currentProject || !currentProject.businessData || !currentProject.strategy) return;

        const { businessData: currentBusinessData, strategy: currentStrategy } = currentProject;
        const targetPlatform = currentStrategy.platformRecommendations.find(p => p.platformName === platformName);
        if (!targetPlatform) return;

        // Set loading state
        const updatedPlatforms = currentStrategy.platformRecommendations.map(p => 
            p.platformName === platformName ? { ...p, isExplaining: true, detailedJustification: undefined } : p
        );
        updateActiveProjectData({ strategy: { ...currentStrategy, platformRecommendations: updatedPlatforms }});
        
        try {
            const explanation = await explainPlatformChoice(currentBusinessData, targetPlatform, currentStrategy.targetPersonas);
            // Update with result - refetch latest project data to avoid race conditions
            const latestProject = getActiveProject();
            if (!latestProject || !latestProject.strategy) return;
            const finalPlatforms = latestProject.strategy.platformRecommendations.map(p =>
                p.platformName === platformName ? { ...p, isExplaining: false, detailedJustification: explanation } : p
            );
            updateActiveProjectData({ strategy: { ...latestProject.strategy, platformRecommendations: finalPlatforms }});
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to get explanation", 'error');
            // Reset loading state on error - refetch latest project data
            const latestProject = getActiveProject();
            if (!latestProject || !latestProject.strategy) return;
            const finalPlatforms = latestProject.strategy.platformRecommendations.map(p =>
                p.platformName === platformName ? { ...p, isExplaining: false } : p
            );
            updateActiveProjectData({ strategy: { ...latestProject.strategy, platformRecommendations: finalPlatforms }});
        }
    };

    const handleStartAnalysis = async () => {
        const url = businessData?.websiteUrl;
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setIsDiscoveryModalOpen(true);
            setIsLoadingProducts(true);
            setIsAnalyzingSite(true);
            setProductsError(null);
            setSiteAnalysisError(null);
            setDiscoveredProducts([]);
            setSiteAnalysisData(null);
            
            try {
                const [productsResponse, analysisResponse] = await Promise.allSettled([
                    discoverProductsFromWebsiteUrl(url),
                    analyzeWebsiteForAnalysisData(url)
                ]);
    
                if (productsResponse.status === 'fulfilled') {
                    if (productsResponse.value.length === 0) {
                        setProductsError("Niti AI couldn't find distinct products on this page.");
                    } else {
                        setDiscoveredProducts(productsResponse.value);
                    }
                } else {
                    setProductsError(productsResponse.reason instanceof Error ? productsResponse.reason.message : 'Failed to discover products.');
                }
    
                if (analysisResponse.status === 'fulfilled') {
                    setSiteAnalysisData(analysisResponse.value);
                } else {
                    setSiteAnalysisError(analysisResponse.reason instanceof Error ? analysisResponse.reason.message : 'Failed to analyze website content.');
                }
            } finally {
                setIsLoadingProducts(false);
                setIsAnalyzingSite(false);
            }
        } else {
            addToast("Please enter a valid URL starting with http:// or https://", "error");
        }
    }

    const handleProductSelect = async (product: DiscoveredProduct) => {
        setIsSummarizing(true);
        try {
            const summary = await summarizeDiscoveredProduct(product, businessData?.businessName || '');
            handleChange('products', summary);
            addToast("Product description has been auto-filled!", "success");
        } catch (err) {
            addToast(err instanceof Error ? err.message : "Could not generate summary.", "error");
        } finally {
            setIsSummarizing(false);
            setIsDiscoveryModalOpen(false);
        }
    }
    
    // --- Wizard Logic ---
    const steps = [
        { title: "Your Business Core", subtitle: "Tell us who you are." },
        { title: "Offerings & Market", subtitle: "Describe what you sell and where you operate." },
        { title: "Business Model", subtitle: "Explain how your business is structured." },
        { title: "Goals & Budget", subtitle: "Define your ambitions and financial scope." },
        { title: "Brand Voice", subtitle: "How do you want to sound to your audience?" },
        { title: "Market Context", subtitle: "Tell us about your competitive landscape." },
        { title: "Final Review", subtitle: "Confirm the details before Niti AI builds your strategy." },
    ];
    const totalSteps = steps.length;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        }
        setAiInsight(null);
        if (insightTimeoutRef.current) clearTimeout(insightTimeoutRef.current);
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
        setAiInsight(null);
        if (insightTimeoutRef.current) clearTimeout(insightTimeoutRef.current);
    };
    // --- End Wizard Logic ---


    return (
        <div className="flex flex-col h-full">
            <ProductDiscoveryModal 
                isOpen={isDiscoveryModalOpen}
                onClose={() => setIsDiscoveryModalOpen(false)}
                isLoadingProducts={isLoadingProducts}
                isAnalyzingSite={isAnalyzingSite}
                isSummarizing={isSummarizing}
                products={discoveredProducts}
                productsError={productsError}
                onSelectProduct={handleProductSelect}
                analysisData={siteAnalysisData}
                analysisError={siteAnalysisError}
                onApplyAnalysis={(field, value) => handleChange(field, value)}
            />

            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div aria-live="polite" className="sr-only">{ariaLiveMessage}</div>
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="text-center">
                            <h2 className="text-3xl font-bold font-heading">Niti AI is Building Your Strategy...</h2>
                            <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2 max-w-2xl mx-auto">This may take a moment. Niti AI is performing live web searches and analyzing your business data to create a tailored plan.</p>
                            <TaskRunner tasks={tasks} />
                        </div>
                    ) : results ? (
                        <div id="printable-strategy" className="animate-fade-in-up space-y-8">
                            {results && showGuidance && (
                                <Card className="mb-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 animate-fade-in-down no-print">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold font-heading text-blue-800 dark:text-blue-200 flex items-center gap-3">
                                                🚀 Your Strategy is Ready!
                                            </h3>
                                            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">Here are your next steps:</p>
                                            <ol className="mt-2 list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                                <li>Review your <strong>Personas</strong> and high-priority <strong>Platforms</strong>.</li>
                                                <li>Use the <strong>'Deploy Strategy'</strong> section to copy targeting details for your ad campaigns.</li>
                                                <li>Refine any part of the plan using the <strong>chat below</strong>.</li>
                                            </ol>
                                        </div>
                                        <button onClick={() => setShowGuidance(false)} className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 p-1 rounded-full">
                                            <CrossIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </Card>
                            )}
                            {results.strategicCore && (
                                <StrategicCoreCard strategicCore={results.strategicCore} />
                            )}
                            {activeProject.businessData.brandVoiceDna && (
                                <Card>
                                    <h3 className="text-xl font-bold font-heading mb-4">🧬 Brand Voice DNA</h3>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-slate-50 dark:bg-surface-dark/60 p-3 rounded-lg">
                                            <p className="font-semibold text-secondary-text-light dark:text-secondary-text-dark">Lexical Sophistication</p>
                                            <p className="font-medium mt-1">{activeProject.businessData.brandVoiceDna.lexicalSophistication}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-surface-dark/60 p-3 rounded-lg">
                                            <p className="font-semibold text-secondary-text-light dark:text-secondary-text-dark">Sentence Structure</p>
                                            <p className="font-medium mt-1">{activeProject.businessData.brandVoiceDna.sentenceStructure}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-surface-dark/60 p-3 rounded-lg">
                                            <p className="font-semibold text-secondary-text-light dark:text-secondary-text-dark">Core Archetypes</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {activeProject.businessData.brandVoiceDna.coreArchetypes.map(a => <span key={a} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-1">{a}</span>)}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-surface-dark/60 p-3 rounded-lg">
                                            <p className="font-semibold text-secondary-text-light dark:text-secondary-text-dark">Common Phrases</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {activeProject.businessData.brandVoiceDna.commonPhrases.map(p => <span key={p} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-1 italic">"{p}"</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                            {results.industryRecommendation && (
                                <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
                                    <h3 className="text-lg font-bold font-heading text-amber-800 dark:text-amber-200 flex items-center gap-3"><SparklesIcon className="w-5 h-5" /> Niti AI Industry Suggestion</h3>
                                    <p className="mt-2 text-amber-700 dark:text-amber-300">Based on your product description, Niti AI suggests targeting the <strong>{results.industryRecommendation.recommendedIndustry}</strong> industry.</p>
                                    <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 italic">Justification: {results.industryRecommendation.justification}</p>
                                </Card>
                            )}
                            <h2 className="text-3xl font-bold font-heading">🎯 Target Personas</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {(results.targetPersonas || []).map(p => <PersonaCard key={p.name} persona={p} />)}
                            </div>
                            <h2 className="text-3xl font-bold font-heading">🚀 Platform Recommendations</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {(results.platformRecommendations || []).map(p => <PlatformCard key={p.platformName} platform={p} onExplain={() => handleExplainPlatform(p.platformName)} />)}
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-8">
                                <Card>
                                    <h3 className="text-xl font-bold font-heading mb-4">📝 Content Strategy</h3>
                                    <div className="space-y-3 text-sm">
                                        <p><strong>Pillars:</strong> {(results.contentStrategy?.pillars || []).join(', ')}</p>
                                        <p><strong>Formats:</strong> {(results.contentStrategy?.formats || []).join(', ')}</p>
                                        <p><strong>Frequency:</strong> {results.contentStrategy?.frequency}</p>
                                        <div>
                                            <strong>Hashtags:</strong>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(results.contentStrategy?.hashtags || []).map(h => <span key={h} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5">{h}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                                <Card>
                                    <h3 className="text-xl font-bold font-heading mb-4">💰 Budget Strategy</h3>
                                    <p className="text-sm mb-4 text-secondary-text-light dark:text-secondary-text-dark">{results.budgetStrategy?.summary}</p>
                                    <BudgetSplitBar splits={results.budgetStrategy?.platformSplits || []} />
                                    <div className="flex justify-between mt-2 text-xs font-semibold text-secondary-text-light dark:text-secondary-text-dark">
                                        {(results.budgetStrategy?.platformSplits || []).map(s => <span key={s.platformName}>{s.platformName} ({s.percentage}%)</span>)}
                                    </div>
                                </Card>
                                <Card>
                                    <h3 className="text-xl font-bold font-heading mb-4">📈 Key Performance Indicators (KPIs)</h3>
                                    <ul className="space-y-2 list-disc pl-5 text-sm">
                                        {(results.kpis || []).map(kpi => <li key={kpi.metric}><strong>{kpi.metric}:</strong> {kpi.description} (Target: {kpi.target})</li>)}
                                    </ul>
                                </Card>
                                <Card>
                                    <h3 className="text-xl font-bold font-heading mb-4">🗓️ Ad Scheduling</h3>
                                    <p className="text-sm">{results.adScheduling}</p>
                                </Card>
                            </div>

                            {results.financialForecast && (
                                <FinancialForecastCard forecast={results.financialForecast} />
                            )}

                            {results.phasedRollout && (
                                <PhasedRolloutPlan plan={results.phasedRollout} />
                            )}

                            {results.riskAnalysis && (
                                <RiskOpportunityMatrix analysis={results.riskAnalysis} />
                            )}

                            <DeploymentGuide strategy={results} personas={results.targetPersonas || []} />
                            
                            <Card className="mt-12 no-print">
                                <h3 className="text-2xl font-bold font-heading mb-2 flex-shrink-0">💬 Chat with Niti AI to Refine</h3>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark mb-4 text-base flex-shrink-0">Ask follow-up questions to iterate on this strategy.</p>
                                <div ref={chatContainerRef} className="max-h-96 space-y-4 overflow-y-auto pr-4 -mr-4 mb-6">
                                    {chatHistory.map((msg, i) => <ChatMessage key={i} message={msg} />)}
                                </div>
                                <div className="relative border-t border-border-light dark:border-border-dark pt-4">
                                    <Input
                                        id="chatMessage"
                                        label="Your Feedback"
                                        type="textarea"
                                        value={chatMessage}
                                        onChange={(_, val) => setChatMessage(val)}
                                        onKeyDown={handleChatKeyDown}
                                        placeholder="e.g., 'Add a recommendation for influencer marketing.'"
                                    />
                                    <button onClick={handleSendMessage} disabled={isChatLoading} className="absolute right-2.5 bottom-2.5 text-white font-bold p-2 rounded-lg bg-primary hover:bg-primary-hover transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isChatLoading ? <div className="w-5 h-5 border-2 border-gray-200 border-t-white rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto animate-fade-in-up">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold font-heading">{steps[currentStep].title}</h2>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark mt-2">{steps[currentStep].subtitle}</p>
                            </div>
                            
                            <ProgressBar current={currentStep + 1} total={totalSteps} />

                            <Card className="mt-8">
                                {currentStep === 0 && (
                                    <div className="space-y-5">
                                        <Input id="businessName" label="Business Name" value={businessData?.businessName || ''} onChange={handleChange} placeholder="e.g., Aethel Watches" />
                                        <div>
                                            <label htmlFor="websiteUrl" className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark mb-1.5">
                                                Website URL (Optional)
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-grow">
                                                    <Input id="websiteUrl" label="" value={businessData?.websiteUrl || ''} onChange={handleChange} placeholder="https://example.com" />
                                                </div>
                                                <button 
                                                    onClick={handleStartAnalysis} 
                                                    disabled={!businessData?.websiteUrl || isLoadingProducts || isAnalyzingSite}
                                                    className="h-[50px] flex-shrink-0 text-white font-semibold rounded-lg bg-secondary hover:bg-indigo-700 transition-all shadow-md shadow-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4"
                                                >
                                                    <SparklesIcon className="w-5 h-5" />
                                                    <span className="text-sm">Analyze</span>
                                                </button>
                                            </div>
                                            <p className="text-xs text-subtle-text-light dark:text-subtle-text-dark mt-1 px-1">Niti AI will analyze your site for brand voice, offerings, and audience insights.</p>
                                        </div>
                                    </div>
                                )}
                                {currentStep === 1 && (
                                    <div className="space-y-5">
                                        <Input id="products" label="Products / Services Description" type="textarea" value={businessData?.products || ''} onChange={handleChange} placeholder="e.g., Sustainable, minimalist timepieces for modern professionals." />
                                        <Input id="geography" label="Geographic Focus" type="select" value={businessData?.geography || 'national'} onChange={handleChange}>
                                            <option value="national">National (based on your location)</option>
                                            <option value="local">Local (City/Region)</option>
                                            <option value="international">International</option>
                                            {countryNames.map(name => <option key={name} value={name}>{name}</option>)}
                                        </Input>
                                        <Input id="productPricePoint" label="Product/Service Price (Approx.)" type="number" startAdornment={currencySymbol} value={businessData?.productPricePoint || ''} onChange={handleChange} placeholder="e.g., 999" />
                                    </div>
                                )}
                                {currentStep === 2 && (
                                     <div className="space-y-5">
                                        <Input id="businessModel" label="Business Model" type="select" value={businessData?.businessModel || ''} onChange={handleChange}>
                                            <option value="">Select a model...</option>
                                            {businessModels.map(model => <option key={model} value={model}>{model}</option>)}
                                        </Input>
                                        <Input id="industry" label="Industry" type="select" value={businessData?.industry || ''} onChange={handleChange}>
                                            <option value="">Select an industry (or leave blank for AI)...</option>
                                            {industryGroups.map(group => (
                                                <optgroup key={group.label} label={group.label}>
                                                    {group.options.map(option => <option key={option} value={option}>{option}</option>)}
                                                </optgroup>
                                            ))}
                                        </Input>
                                        <Input id="companySize" label="Company Size" type="select" value={businessData?.companySize || ''} onChange={handleChange}>
                                            <option value="">Select size...</option>
                                            <option>Solopreneur</option><option>1-10 employees</option><option>11-50 employees</option><option>51-200 employees</option><option>201+ employees</option>
                                        </Input>
                                     </div>
                                )}
                                {currentStep === 3 && (
                                    <div className="space-y-5">
                                        <Input id="businessGoals" label="Primary Business Goal" type="select" value={businessData?.businessGoals || ''} onChange={handleChange}>
                                            <option value="">Select a goal...</option>
                                            {businessGoals.map(goal => <option key={goal} value={goal}>{goal}</option>)}
                                        </Input>
                                        <div>
                                            <Input id="budget" label="Monthly Marketing Budget (Approx.)" type="number" startAdornment={currencySymbol} value={businessData?.budget || ''} onChange={handleChange} placeholder="e.g., 5000" />
                                            <div className="mt-2 min-h-10">
                                                {isAnalyzingBudget && <div className="flex items-center gap-2 text-sm text-secondary-text-light dark:text-secondary-text-dark"><Spinner size="small" /><span>Analyzing budget...</span></div>}
                                                {budgetFeedback && !isAnalyzingBudget && (
                                                    <div className={`flex items-start gap-2 text-sm p-2 rounded-lg border animate-fade-in ${feedbackClasses[budgetFeedback.rating].container}`}>
                                                        <span className="text-base">{feedbackClasses[budgetFeedback.rating].icon}</span>
                                                        <p className={feedbackClasses[budgetFeedback.rating].text}>
                                                            <strong>{budgetFeedback.rating}:</strong> {budgetFeedback.feedback} (Suggests: {budgetFeedback.suggestedBudgetRange})
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {currentStep === 4 && (
                                    <div className="space-y-5">
                                        <Input id="brandVoiceSamples" label="Brand Voice Samples (Optional)" type="textarea" value={businessData?.brandVoiceSamples || ''} onChange={handleChange} placeholder="Paste text that reflects your brand's tone..." />
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark mb-1.5">
                                                Brand Personality Traits (Optional)
                                            </label>
                                            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                                                {personalityTraits.map(trait => (
                                                <label key={trait} className="flex items-center gap-2 text-sm p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50">
                                                    <input type="checkbox" checked={businessData?.brandPersonalityTraits?.includes(trait) || false} onChange={() => handleCheckboxChange(trait)} className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 bg-surface-light dark:bg-surface-dark" />
                                                    {trait}
                                                </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                 {currentStep === 5 && (
                                    <div className="space-y-5">
                                        <Input id="competitors" label="Key Competitors (Optional)" value={businessData?.competitors || ''} onChange={handleChange} placeholder="e.g., Competitor A, Competitor B" />
                                        <Input id="currentMarketingStrategy" label="Past/Current Marketing Strategy (Optional)" type="textarea" value={businessData?.currentMarketingStrategy || ''} onChange={handleChange} placeholder="e.g., Previously ran Facebook Ads targeting interests X, Y, Z." />
                                    </div>
                                )}
                                

                                {aiInsight && <AiInsight message={aiInsight} onDismiss={() => setAiInsight(null)} />}

                                <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark flex justify-between items-center">
                                    <button onClick={handleBack} disabled={currentStep === 0} className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
                                        Back
                                    </button>
                                    {currentStep < totalSteps - 1 ? (
                                        <button onClick={handleNext} className="px-5 py-2.5 text-sm text-white font-semibold rounded-lg bg-primary hover:bg-primary-hover transition-all shadow-md shadow-primary/30 disabled:opacity-50">
                                            {currentStep === totalSteps - 2 ? 'Review & Generate' : 'Next →'}
                                        </button>
                                    ) : (
                                        <button onClick={handleGenerateAnalysis} disabled={loading} className="w-auto text-white font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                            ✨ Generate Strategy
                                        </button>
                                    )}
                                </div>
                            </Card>
                             {currentStep === totalSteps - 1 && (
                                <Card className="mt-6">
                                    <h3 className="font-bold text-lg mb-2">Final Review</h3>
                                     <ul className="space-y-2 text-sm max-h-80 overflow-y-auto pr-2">
                                        {Object.entries(businessData || {}).map(([key, value]) => {
                                            if (!value || (Array.isArray(value) && value.length === 0)) return null;
                                            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                            return (
                                                <li key={key} className="flex justify-between p-2 bg-slate-50 dark:bg-surface-dark/60 rounded-md">
                                                    <span className="font-semibold">{label}:</span>
                                                    <span className="text-right text-secondary-text-light dark:text-secondary-text-dark">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StrategyBuilder;
