import React from 'react';
import { useAppContext } from './contexts/AppContext';
import IntegrationsModal from './components/IntegrationsModal';
import ToastContainer from './components/ToastContainer';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import YugnAiHub from './pages/NitiAiHub';
// FIX: Changed to a named import to resolve potential module resolution issues.
import { OnboardingGuide } from './components/OnboardingGuide';
import CreateProjectModal from './components/CreateProjectModal';

const App: React.FC = () => {
  const { 
    isIntegrationsModalOpen, 
    closeIntegrationsModal, 
    isAuthenticated,
    isOnboardingActive,
    publicPage,
  } = useAppContext();

  const renderPublicPage = () => {
    switch (publicPage) {
      case 'about':
        return <AboutPage />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return (
    <>
      {isAuthenticated ? <YugnAiHub /> : renderPublicPage()}
      <IntegrationsModal isOpen={isIntegrationsModalOpen} onClose={closeIntegrationsModal} />
      <CreateProjectModal />
      {isOnboardingActive && <OnboardingGuide />}
      <ToastContainer />
    </>
  );
};

export default App;
