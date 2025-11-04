

export interface User {
  name: string;
  email: string;
  picture: string;
}

export const Tab = {
  Dashboard: 'dashboard',
  Strategy: 'strategy',
  Lab: 'lab',
  Planner: 'planner',
  Assets: 'assets',
  Campaigns: 'campaigns',
  Content: 'content',
  Advisor: 'advisor',
  Seo: 'seo',
} as const;

export type Tab = typeof Tab[keyof typeof Tab];


export type Platform = 'meta' | 'google' | 'linkedin';

// New interface for Brand Voice DNA
export interface BrandVoiceDna {
    lexicalSophistication: string;
    coreArchetypes: string[];
    commonPhrases: string[];
    sentenceStructure: string;
}

export interface BusinessData {
  businessName: string;
  businessModel: string;
  industry: string;
  products: string;
  businessGoals: string;
  companySize: string;
  budget: string;
  productPricePoint: string;
  currentCustomers: string;
  analysisType: string;
  competitors: string;
  geography: string;
  currentMarketingStrategy: string;
  websiteUrl?: string;
  // New fields for Brand Voice
  brandVoiceSamples?: string;
  brandPersonalityTraits?: string[];
  // New field for automated Brand Voice DNA analysis
  brandVoiceDna?: BrandVoiceDna;
}

export interface GroundingSource {
    justification: string;
    url: string;
}

export interface Persona {
  name: string;
  age: string;
  demographics: string[];
  psychographics: string[];
  interests: string[];
  painPoints: string[];
  platforms: string[];
  // New field for detailed Meta targeting
  metaTargeting?: {
      directInterests: string[];
      indirectInterests: string[];
      behaviors: string[];
      lifeEvents?: string[];
  };
  // New field for evidence-based persona generation
  groundingSources?: GroundingSource[];
}

export interface ContentStrategy {
  pillars: string[];
  formats: string[];
  frequency: string;
  topics: string[];
  hashtags: string[];
}

// New interface for Google Ads Keywords
export interface GoogleAdsKeywords {
    broad: string[];
    phrase: string[];
    exact: string[];
}

export interface PlatformStrategy {
  platformName: string;
  priority: 'High' | 'Medium' | 'Low';
  contentFocus: string;
  adStrategy: string;
  justification: string; // New field for transparency
  suggestedAdFormats: string[];
  keyMetricsToWatch: string[];
  detailedJustification?: string;
  isExplaining?: boolean;
  googleAdsKeywords?: GoogleAdsKeywords;
}

export interface Kpi {
    metric: string;
    description: string;
    target: string;
}

export interface BudgetSplit {
    platformName: string;
    percentage: number;
}

export interface BudgetStrategy {
    summary: string;
    platformSplits: BudgetSplit[];
}

export interface CompetitorAnalysis {
    name: string;
    strengths: string[];
    weaknesses: string[];
    opportunityForUs: string;
}

export interface StrategicCore {
  brandArchetype: string;
  archetypeJustification: string;
  strategicAngle: string;
}

// --- New types for advanced strategy modules ---

// For Phased Rollout
export interface PhaseActionItem {
    item: string;
    category: 'Setup' | 'Campaign' | 'Content' | 'Analysis' | 'SEO';
}

export interface Phase {
    title: string; // e.g., "Phase 1: 0-30 Days (Foundation & Quick Wins)"
    focus: string;
    actionItems: PhaseActionItem[];
}

// For Financial Forecast
export interface ChannelForecast {
    platformName: string;
    projectedSpend: string;
    projectedKpis: {
        metric: string; // e.g., "Clicks", "Leads", "Impressions"
        value: string; // e.g., "200 - 350", "5 - 12"
    }[];
}

export interface FinancialForecast {
    summary: string;
    channelForecasts: ChannelForecast[];
    disclaimer: string;
}

// For Risk Analysis
export interface RiskAnalysisItem {
    description: string;
    impact: 'High' | 'Medium' | 'Low';
}

export interface RiskAnalysis {
    risks: RiskAnalysisItem[];
    opportunities: RiskAnalysisItem[];
}

// --- End of new types ---

export interface MarketingAnalysis {
  strategicCore?: StrategicCore;
  industryRecommendation?: {
    recommendedIndustry: string;
    justification: string;
  };
  competitorAnalysis: CompetitorAnalysis[];
  targetPersonas: Persona[];
  platformRecommendations: PlatformStrategy[];
  contentStrategy: ContentStrategy;
  kpis: Kpi[];
  budgetStrategy: BudgetStrategy;
  adScheduling: string;
  // New advanced strategy fields
  phasedRollout?: Phase[];
  financialForecast?: FinancialForecast;
  riskAnalysis?: RiskAnalysis;
}

export interface AssetAnalysisResult {
  rating: 'Excellent' | 'Good' | 'Needs Improvement';
  feedback: string;
  suggestions?: string[];
}

export interface AssetFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
  analysis?: AssetAnalysisResult;
  isAnalyzing?: boolean;
  isSuggesting?: boolean;
  tags?: string[];
  isGeneratingTags?: boolean;
}

export interface CampaignData {
    name:string;
    ctr: number;
    cpc: number;
    conversions: number;
    roas: number;
    performance: 'Above Average' | 'Good' | 'Needs Optimization';
    progress: number;
}

export interface OptimizationSuggestion {
    platform: string;
    suggestion: string;
    impact: 'High' | 'Medium' | 'Low';
    rationale: string; // New field for transparency
}

export interface PredictedMetrics {
    platform: string;
    predictedCtr: string;
    predictedCpc: string;
    predictedConversions: string;
    predictedRoas: string;
}

export interface CampaignForecast {
    forecastSummary: string;
    predictedMetrics: PredictedMetrics[];
}

export interface AbTestSuggestion {
  hypothesis: string;
  variantA: string;
  variantB: string;
  metricToWatch: string;
}

export interface ContentGenerationParams {
  platform: string;
  type: string;
  topic: string;
  tone: string;
  keywords: string;
  assetId?: string;
  // New field for Ad Creative Studio
  personaName?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundedResponse {
  text: string;
  sources: GroundingChunk[];
}

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: GroundingChunk[];
  isLoading?: boolean;
}

// --- SEO Types ---

export interface ActionItem {
    recommendation: string;
    category: 'On-Page' | 'Technical' | 'Content' | 'Backlinks';
    impact: 'High' | 'Medium' | 'Low';
    effort: 'Easy' | 'Medium' | 'Hard';
    isGeneratingSuggestions?: boolean;
    suggestions?: string[];
    isGeneratingBrief?: boolean;
    brief?: string;
}

export type SeoCheckStatus = 'Good' | 'Warning' | 'Error' | 'Not Found';

export interface TechnicalCheck {
    status: SeoCheckStatus;
    details: string;
}

export interface CoreWebVitalsCheck extends TechnicalCheck {
    lcp?: string;
    cls?: string;
    inp?: string;
}

export interface SeoCategoryAnalysis {
    score: number; // 0-100
    summary: string;
}

export interface OnPageCheck extends TechnicalCheck {}

export interface OnPageSeoDetails extends SeoCategoryAnalysis {
    titleTag: OnPageCheck;
    metaDescription: OnPageCheck;
    headerHierarchy: OnPageCheck;
    imageSeo: OnPageCheck;
    internalLinking: OnPageCheck;
}

export interface TechnicalSeoAudit extends SeoCategoryAnalysis {
    robotsTxt: TechnicalCheck;
    sitemap: TechnicalCheck;
    coreWebVitals: CoreWebVitalsCheck;
    structuredData: TechnicalCheck;
}

export interface BacklinkProfile extends SeoCategoryAnalysis {
    estimatedReferringDomains?: number;
    authorityScore?: 'Low' | 'Medium' | 'High';
    anchorTextThemes?: string[];
    profileHealthSummary?: string;
}

export interface KeywordPerformance {
    keyword: string;
    estimatedRank: string; // e.g., "Top 5", "10-20", "Not in top 50"
    analysis: string; // A brief summary of why it ranks this way
}

export interface KeywordIntelligence {
    serpIntent?: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | 'Mixed';
    serpIntentAnalysis?: string;
    peopleAlsoAsk?: string[];
    contentGapAnalysis?: {
        summary: string;
        missingTopics: string[];
    };
}

// New type for SERP Feature Analysis
export interface SerpAnalysis {
    dominantFeatures: string[];
    strategicRecommendation: string;
}

export interface SeoAudit {
    auditStatus?: 'Success' | 'Failed';
    failureReason?: string;
    onPage: OnPageSeoDetails;
    technical: TechnicalSeoAudit;
    content: SeoCategoryAnalysis;
    backlinks: BacklinkProfile;
    keywordIntelligence?: KeywordIntelligence;
    actionPlan?: {
        summary: string;
        items: ActionItem[];
    };
    keywordAnalysis?: {
        summary: string;
        keywords: KeywordPerformance[];
    };
    // New field for SERP feature analysis
    serpAnalysis?: SerpAnalysis;
}

export interface KeyOpportunity {
    opportunity: string;
    description: string;
}

export interface CompetitiveSummary {
    comparison: string;
    opportunities: KeyOpportunity[];
}

export interface SeoAnalysisResult {
    userSiteAnalysis: SeoAudit;
    competitorAnalyses?: (SeoAudit & { url: string })[];
    competitiveSummary?: CompetitiveSummary;
}


export interface AlgorithmUpdate {
    title: string;
    summary: string;
    source: string;
}

export interface ProactiveAdvice {
    observation: string;
    recommendation: string;
    impact: 'High' | 'Medium' | 'Low';
    area: Tab; // Relates the advice to a specific part of the app
}

// For Toast notifications
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

// For Interactive Onboarding
export interface OnboardingStep {
  targetId: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  preAction?: (context: AppContextType) => void;
}

// New types for Planner
export type CalendarEntryStatus = 'To Do' | 'In Progress' | 'Done';

export interface CalendarEntry {
    id: string;
    date: string; // ISO string format: "YYYY-MM-DD"
    platform: string;
    topic: string;
    contentType: string; // e.g., 'Blog Post', 'Carousel Ad'
    status: CalendarEntryStatus;
    isGenerating?: boolean;
    generatedContent?: string;
}

// New types for AI Outreach Co-Pilot
export interface OutreachMessage {
    hook: string; // The specific info used for personalization
    message: string;
}

export interface OutreachProspect {
    id: string;
    linkedInUrl: string;
    personaName: string;
    prospectName: string;
    prospectSummary: string;
    messages: OutreachMessage[];
    isGenerating?: boolean;
}

// --- New types for AI Resonance Lab ---

export interface AdCreativeVariation {
    id: string;
    theme: string; // e.g., "Benefit-focused", "Pain-point focused"
    headline: string;
    body: string;
    // New fields for "Create Variations" feature
    variations?: string[];
    isGeneratingVariations?: boolean;
}

export interface PersonaFeedback {
    creativeId: string;
    personaName: string;
    feedback: string;
    resonanceScore: number; // 1-10
}

export interface ResonanceReport {
    generatedCreatives: AdCreativeVariation[];
    personaFeedback: PersonaFeedback[];
    analysisSummary: string;
    winningCreativeId: string;
}

// Updated Project structure
export interface Project {
  id: string;
  name: string;
  businessData: BusinessData;
  strategy: MarketingAnalysis | null;
  assets: AssetFile[];
  calendar?: CalendarEntry[];
  outreachProspects?: OutreachProspect[];
  resonanceReport?: ResonanceReport | null;
  // New field for the "Project Brain"
  knowledgeBase?: string;
}

// For real-time budget analysis
export interface BudgetAnalysis {
  rating: 'Low' | 'Moderate' | 'Competitive' | 'High';
  feedback: string;
  suggestedBudgetRange: string;
}

// For AI Orchestrator Task Runner
export type TaskStatus = 'pending' | 'running' | 'complete';
export interface Task {
    name: string;
    status: TaskStatus;
    isOptional?: boolean;
}

// For Image Generation
export interface GeneratedImage {
  image?: {
    imageBytes?: string; // base64 encoded string
    mimeType?: string;
  };
  altText?: string; // Add optional altText for completeness
}

// For Product Discovery
export interface DiscoveredProduct {
    name: string;
    description: string;
}

// For Website Link Discovery
export interface DiscoveredLinks {
  blog?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
}

// For deeper website analysis
export interface WebsiteAnalysisData {
    brandVoiceSample: string;
    suggestedIndustry: string;
    marketingKeywords: string;
    platformNuances?: string;
}

// For AI Knowledge Base
export interface KnowledgeBase {
    content: string;
    lastUpdated: string; // ISO string
}

// For AppContext
export interface AppContextType {
  isIntegrationsModalOpen: boolean;
  openIntegrationsModal: () => void;
  closeIntegrationsModal: () => void;
  clearAppData: () => void;
  
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  
  // Onboarding state
  isOnboardingActive: boolean;
  currentOnboardingStepIndex: number;
  onboardingSteps: OnboardingStep[];
  startOnboarding: () => void;
  endOnboarding: () => void;
  goToNextOnboardingStep: () => void;
  goToPrevOnboardingStep: () => void;

  // Shared state
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (isOpen: boolean) => void;

  // Project state
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
  getActiveProject: () => Project | null;
  updateActiveProjectData: (data: Partial<Omit<Project, 'id' | 'name'>>) => void;
  createProject: (name: string) => void;
  isCreateProjectModalOpen: boolean;
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  summarizeAndUpdateKnowledgeBase: (type: 'strategy' | 'seo', data: any) => Promise<void>;
  
  // New for Planner -> Content Generator workflow
  contentGeneratorPrefill: ContentGenerationParams | null;
  setContentGeneratorPrefill: (params: ContentGenerationParams | null) => void;
}
