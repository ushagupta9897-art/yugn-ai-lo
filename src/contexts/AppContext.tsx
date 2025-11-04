import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppContextType, BusinessData, MarketingAnalysis, User, OnboardingStep, Project, ContentGenerationParams, SeoAnalysisResult } from '../types';
import { Tab } from '../types';
import { summarizeStrategyForKnowledgeBase, summarizeSeoAuditForKnowledgeBase } from '../services/geminiService';


const AppContext = createContext<AppContextType | undefined>(undefined);

const initialBusinessData: BusinessData = {
    businessName: '', businessModel: '', industry: '', products: '', businessGoals: '',
    companySize: '', budget: '', productPricePoint: '', currentCustomers: '', analysisType: 'comprehensive', 
    competitors: '', geography: 'national', currentMarketingStrategy: ''
};


const getOnboardingSteps = (): OnboardingStep[] => [
  {
    targetId: '', // Centered
    title: 'Welcome to Yugn AI Hub!',
    content: "This quick tour will guide you through the core features to supercharge your marketing workflow.",
    placement: 'center',
  },
  {
    targetId: 'nav-strategy',
    title: '1. Strategy Builder',
    content: 'Start here. Fill in your business details, and our AI will generate a comprehensive marketing strategy.',
    placement: 'right',
    preAction: (ctx) => {
        ctx.setActiveTab(Tab.Strategy);
        ctx.setIsSidebarOpen(true);
    },
  },
  {
    targetId: 'strategy-config',
    title: 'Configure Your Business',
    content: 'Input your business information in this panel. The more detail you provide, the better the AI strategy will be.',
    placement: 'right',
  },
  {
    targetId: 'generate-strategy-button',
    title: 'Generate Your Plan',
    content: "Once you're ready, click here to generate your personalized marketing plan.",
    placement: 'top',
  },
  {
    targetId: 'nav-assets',
    title: '2. Asset Manager',
    content: 'Next, upload your creative assets. Get AI-powered analysis on ad creatives and auto-tagging for easy management.',
    placement: 'right',
    preAction: (ctx) => ctx.setActiveTab(Tab.Assets),
  },
  {
    targetId: 'nav-content',
    title: '3. Content Generator',
    content: "Now, let's create some content! This tool uses your strategy and assets to generate compelling copy for any platform.",
    placement: 'right',
    preAction: (ctx) => {
        ctx.setActiveTab(Tab.Content);
        ctx.setIsSidebarOpen(true);
    },
  },
  {
    targetId: 'content-config',
    title: 'Configure Your Content',
    content: 'Select your platform, tone, and topic. You can even use your strategy data or an uploaded image to guide the AI.',
    placement: 'right',
  },
  {
    targetId: 'nav-campaigns',
    title: '4. Campaign Analysis',
    content: 'Next, analyze campaign performance. This is where you can upload screenshots of your ad dashboards for review.',
    placement: 'right',
    preAction: (ctx) => {
        ctx.setActiveTab(Tab.Campaigns);
        ctx.setIsSidebarOpen(true);
    },
  },
  {
    targetId: 'campaign-upload',
    title: 'Upload Performance Data',
    content: "Simply upload a screenshot of your campaign data, and Yugn AI will provide optimizations, forecasts, and A/B test ideas.",
    placement: 'right',
  },
  {
    targetId: 'nav-seo',
    title: '5. SEO Optimizer',
    content: 'Analyze any website to get a full SEO audit, including on-page, technical, and content recommendations.',
    placement: 'right',
    preAction: (ctx) => {
        ctx.setActiveTab(Tab.Seo);
        ctx.setIsSidebarOpen(true);
    },
  },
  {
    targetId: 'seo-config',
    title: 'Enter a URL to Analyze',
    content: "Provide a website URL and optional keywords. Yugn AI will crawl the site and give you a detailed report.",
    placement: 'right',
  },
  {
    targetId: 'nav-advisor',
    title: '6. Yugn AI Advisor',
    content: 'This is your marketing expert on demand. Get proactive advice and ask any marketing question to get real-time, web-grounded answers.',
    placement: 'right',
    preAction: (ctx) => ctx.setActiveTab(Tab.Advisor),
  },
  {
    targetId: 'advisor-chat-input',
    title: 'Ask Anything',
    content: "Type your marketing questions here to get instant insights from Yugn AI, backed by live Google Search results.",
    placement: 'top',
  },
  {
    targetId: '', // Centered
    title: "You're All Set!",
    content: "You're ready to explore. Dive in and start building your next-level marketing strategy!",
    placement: 'center',
  },
];

interface AppData {
    projects: Project[];
    activeProjectId: string | null;
}

// Helper to safely parse JSON from localStorage
function safelyParseJSON<T>(jsonString: string | null, defaultValue: T): T {
    if (!jsonString) return defaultValue;
    try {
        const parsed = JSON.parse(jsonString);
        // Basic validation to ensure it has the expected structure
        if (typeof parsed === 'object' && parsed !== null) {
            return parsed as T;
        }
        return defaultValue;
    } catch (error) {
        console.error("Failed to parse JSON from localStorage", error);
        return defaultValue;
    }
}


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isIntegrationsModalOpen, setIntegrationsModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => 
    safelyParseJSON<boolean>(localStorage.getItem('isAuthenticated'), false)
  );
  const [user, setUser] = useState<User | null>(() =>
    safelyParseJSON<User | null>(localStorage.getItem('user'), null)
  );
  
  // Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // New state for Planner -> Content Generator workflow
  const [contentGeneratorPrefill, setContentGeneratorPrefill] = useState<ContentGenerationParams | null>(null);

  // Onboarding State
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentOnboardingStepIndex, setCurrentOnboardingStepIndex] = useState(0);
  
  // Load all app data from a single localStorage item on mount
  useEffect(() => {
    const appData = safelyParseJSON<AppData | null>(localStorage.getItem('yugn-ai-app-data'), null);
    if (appData && Array.isArray(appData.projects) && appData.projects.length > 0) {
      setProjects(appData.projects);
      setActiveProjectId(appData.activeProjectId || appData.projects[0].id);
    } else {
      // If no data, create a default project to start with
      const newProjectId = `proj_${Date.now()}`;
      const defaultProject: Project = {
        id: newProjectId,
        name: 'My First Project',
        businessData: initialBusinessData,
        strategy: null,
        assets: [],
        calendar: [],
        knowledgeBase: '',
      };
      setProjects([defaultProject]);
      setActiveProjectId(newProjectId);
    }
  }, []);

  // Save all project-related data to localStorage whenever it changes
  useEffect(() => {
    if (projects.length > 0 || activeProjectId) {
      const appData: AppData = { projects, activeProjectId };
      localStorage.setItem('yugn-ai-app-data', JSON.stringify(appData));
    }
  }, [projects, activeProjectId]);


  // Save auth state to localStorage
  useEffect(() => {
    localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
    localStorage.setItem('user', JSON.stringify(user));
  }, [isAuthenticated, user]);


  const getActiveProject = () => {
    return projects.find(p => p.id === activeProjectId) || null;
  };

  const updateActiveProjectData = (data: Partial<Omit<Project, 'id' | 'name'>>) => {
    setProjects(prevProjects => 
        prevProjects.map(p => 
            p.id === activeProjectId ? { ...p, ...data } : p
        )
    );
  };
  
  const createProject = (name: string) => {
    const newProjectId = `proj_${Date.now()}`;
    const newProject: Project = {
        id: newProjectId,
        name,
        businessData: initialBusinessData,
        strategy: null,
        assets: [],
        calendar: [],
        knowledgeBase: '',
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProjectId);
    setActiveTab(Tab.Strategy);
  };

  const clearAppData = () => {
    const newProjectId = `proj_${Date.now()}`;
    const defaultProject: Project = {
        id: newProjectId,
        name: 'My First Project',
        businessData: initialBusinessData,
        strategy: null,
        assets: [],
        calendar: [],
        knowledgeBase: '',
    };
    setProjects([defaultProject]);
    setActiveProjectId(newProjectId);
    localStorage.removeItem('userFeedback');
    localStorage.removeItem('yugn-ai-app-data');
  };

  const summarizeAndUpdateKnowledgeBase = async (type: 'strategy' | 'seo', data: any) => {
    const currentProject = getActiveProject();
    if (!currentProject) return;

    try {
        let summary = '';
        if (type === 'strategy') {
            summary = await summarizeStrategyForKnowledgeBase(data as MarketingAnalysis);
        } else if (type === 'seo') {
            summary = await summarizeSeoAuditForKnowledgeBase(data as SeoAnalysisResult);
        }

        const currentKnowledge = currentProject.knowledgeBase || '';
        // A simple way to append and avoid duplicates, can be improved.
        const newKnowledge = `${currentKnowledge}\n\n---${type.toUpperCase()} SUMMARY---\n${summary}`.trim();

        updateActiveProjectData({ knowledgeBase: newKnowledge });
    } catch (e) {
        console.error(`Failed to update knowledge base for ${type}:`, e);
        // Optionally add a toast message here
    }
  };
  
  const contextValue = React.useMemo(() => {
    const value: AppContextType = {
      isIntegrationsModalOpen,
      openIntegrationsModal: () => setIntegrationsModalOpen(true),
      closeIntegrationsModal: () => setIntegrationsModalOpen(false),
      isCreateProjectModalOpen,
      openCreateProjectModal: () => setCreateProjectModalOpen(true),
      closeCreateProjectModal: () => setCreateProjectModalOpen(false),
      isAuthenticated,
      user,
      isOnboardingActive,
      currentOnboardingStepIndex,
      onboardingSteps: getOnboardingSteps(), // Temp value, will be updated
      activeTab,
      setActiveTab,
      isSidebarOpen,
      setIsSidebarOpen,
      isMobileNavOpen,
      setIsMobileNavOpen,
      projects,
      activeProjectId,
      setActiveProjectId,
      getActiveProject,
      updateActiveProjectData,
      createProject,
      clearAppData,
      summarizeAndUpdateKnowledgeBase,
      contentGeneratorPrefill,
      setContentGeneratorPrefill,
      startOnboarding: () => {
        setActiveTab(Tab.Strategy);
        setIsSidebarOpen(true);
        setCurrentOnboardingStepIndex(0);
        setIsOnboardingActive(true);
      },
      endOnboarding: () => {
        setIsOnboardingActive(false);
        localStorage.setItem('onboardingCompleted', 'true');
      },
      goToNextOnboardingStep: () => {}, // Temp value
      goToPrevOnboardingStep: () => {}, // Temp value
      login: () => {
        const mockUser: User = {
          name: 'Alex Doe',
          email: 'alex.doe@example.com',
          picture: `https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Doe&backgroundColor=4f46e5&textColor=ffffff&fontSize=36`
        };
        setUser(mockUser);
        setIsAuthenticated(true);
      },
      logout: () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      },
    };

    value.onboardingSteps = getOnboardingSteps();
    
    value.goToNextOnboardingStep = () => {
      if (value.currentOnboardingStepIndex < value.onboardingSteps.length - 1) {
        const nextStepIndex = value.currentOnboardingStepIndex + 1;
        const nextStep = value.onboardingSteps[nextStepIndex];
        if (nextStep.preAction) {
          nextStep.preAction(value);
        }
        setCurrentOnboardingStepIndex(nextStepIndex);
      } else {
        value.endOnboarding();
      }
    };

    value.goToPrevOnboardingStep = () => {
      if (value.currentOnboardingStepIndex > 0) {
        const prevStepIndex = value.currentOnboardingStepIndex - 1;
        const prevStep = value.onboardingSteps[prevStepIndex];
        if (prevStep.preAction) {
          prevStep.preAction(value);
        }
        setCurrentOnboardingStepIndex(prevStepIndex);
      }
    };
    
    // Override login to handle onboarding start
    value.login = () => {
        const mockUser: User = {
            name: 'Alex Doe',
            email: 'alex.doe@example.com',
            picture: `https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Doe&backgroundColor=4f46e5&textColor=ffffff&fontSize=36`
        };
        setUser(mockUser);
        setIsAuthenticated(true);
        
        const onboardingCompleted = localStorage.getItem('onboardingCompleted');
        if (!onboardingCompleted) {
            value.startOnboarding();
        }
    };

    return value;
  }, [
    isIntegrationsModalOpen, 
    isCreateProjectModalOpen,
    isAuthenticated, 
    user, 
    isOnboardingActive, 
    currentOnboardingStepIndex, 
    activeTab, 
    isSidebarOpen,
    isMobileNavOpen,
    projects, 
    activeProjectId,
    contentGeneratorPrefill
  ]);


  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
