import React, { Suspense, lazy } from 'react';
import { Tab as TabEnum } from '../types';
import SideNav from '../components/SideNav';
import { useAppContext } from '../contexts/AppContext';
import { AppIcon } from '../components/icons/AppIcon';
import PageLoader from '../components/PageLoader';
import Header from '../components/Header';

// Lazy-load all tab components for code-splitting
const ComingSoon = lazy(() => import('../tabs/ComingSoon'));
const Dashboard = lazy(() => import('../tabs/Dashboard'));
const StrategyBuilder = lazy(() => import('../tabs/StrategyBuilder'));
const ResonanceLab = lazy(() => import('../tabs/ResonanceLab'));
const Planner = lazy(() => import('../tabs/Planner'));
const AssetManager = lazy(() => import('../tabs/AssetManager'));
const CampaignAnalysis = lazy(() => import('../tabs/CampaignAnalysis'));
const ContentGenerator = lazy(() => import('../tabs/ContentGenerator'));
const SeoOptimizer = lazy(() => import('../tabs/SeoOptimizer'));
const AIAdvisor = lazy(() => import('../tabs/AIAdvisor'));


const YugnAiHub: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    getActiveProject, 
    openCreateProjectModal,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSidebarOpen,
    setIsSidebarOpen
  } = useAppContext();
  const activeProject = getActiveProject();

  const tabInfo: { [key in TabEnum]: { title: string; subtitle: string, hasConfigSidebar: boolean } } = {
    [TabEnum.Dashboard]: { title: "Project Dashboard", subtitle: "An at-a-glance overview of your marketing strategy.", hasConfigSidebar: false },
    [TabEnum.Strategy]: { title: "Strategy Builder", subtitle: "Generate a comprehensive marketing strategy powered by Yugn AI.", hasConfigSidebar: false },
    [TabEnum.Lab]: { title: "AI Resonance Lab", subtitle: "Test your creative against an AI focus group before you launch.", hasConfigSidebar: false },
    [TabEnum.Planner]: { title: "Campaign Planner", subtitle: "Organize and track your content schedule with an AI-powered calendar.", hasConfigSidebar: false },
    [TabEnum.Assets]: { title: "Asset Manager", subtitle: "Upload, manage, and analyze your creative assets with Yugn AI.", hasConfigSidebar: false },
    [TabEnum.Campaigns]: { title: "Campaign Analysis", subtitle: "Get Yugn AI-powered optimizations, forecasts, and A/B test ideas.", hasConfigSidebar: true },
    [TabEnum.Content]: { title: "Content Generator", subtitle: "Create compelling marketing copy for any platform in seconds.", hasConfigSidebar: true },
    [TabEnum.Seo]: { title: "SEO Optimizer", subtitle: "Analyze any website to get Yugn AI-powered SEO recommendations.", hasConfigSidebar: true },
    [TabEnum.Advisor]: { title: "Yugn AI Advisor", subtitle: "Get proactive advice and real-time marketing insights from the web.", hasConfigSidebar: false },
  };
  
  const currentTabInfo = tabInfo[activeTab] || tabInfo[TabEnum.Dashboard];

  const renderTabContent = React.useCallback(() => {
    if (!activeProject) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                <AppIcon className="w-10 h-10 text-white"/>
            </div>
            <h2 className="text-2xl font-bold">Welcome to Yugn AI Hub!</h2>
            <p className="mt-2 text-secondary-text-light dark:text-secondary-text-dark max-w-sm">
                To get started, create your first project. A project contains all the marketing data for a single campaign or client.
            </p>
            <button 
                onClick={openCreateProjectModal} 
                className="mt-6 text-white font-bold py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
            >
                + Create New Project
            </button>
        </div>
      );
    }

    switch (activeTab) {
      case TabEnum.Dashboard:
        return <Dashboard />;
      case TabEnum.Strategy:
        return <StrategyBuilder />;
      case TabEnum.Lab:
        return <ResonanceLab />;
      case TabEnum.Planner:
        return <Planner />;
      case TabEnum.Content:
        return <ContentGenerator />;
      case TabEnum.Advisor:
        return <AIAdvisor />;
      case TabEnum.Assets:
        return <AssetManager />;
      case TabEnum.Campaigns:
        return <CampaignAnalysis />;
      case TabEnum.Seo:
        return <SeoOptimizer />;
      default:
        return <ComingSoon />;
    }
  }, [activeTab, activeProject, openCreateProjectModal]);

  return (
    <div className="flex h-screen bg-light dark:bg-dark text-primary-text-light dark:text-primary-text-dark font-sans">
      {/* Mobile Nav Overlay */}
      <div 
        onClick={() => setIsMobileNavOpen(false)} 
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${isMobileNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        aria-hidden="true"
      />
      
      <div className={`fixed lg:static inset-y-0 left-0 z-40 transition-transform transform ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <SideNav activeTab={activeTab} setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileNavOpen(false); // Close nav on tab selection
        }} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-light dark:bg-dark">
        <Header
            title={currentTabInfo.title}
            subtitle={currentTabInfo.subtitle}
            showConfigSidebarToggle={currentTabInfo.hasConfigSidebar}
            isConfigSidebarOpen={isSidebarOpen}
            onConfigSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onMobileNavToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
            <Suspense fallback={<PageLoader />}>
                {renderTabContent()}
            </Suspense>
        </main>
      </div>
    </div>
  );
};

export default YugnAiHub;