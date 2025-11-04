

import React from 'react';
import { useAppContext } from './contexts/AppContext';
import IntegrationsModal from './components/IntegrationsModal';
import ToastContainer from './components/ToastContainer';
import LandingPage from './pages/LandingPage';
import YugnAiHub from './pages/NitiAiHub';
import { OnboardingGuide } from './components/OnboardingGuide';
import CreateProjectModal from './components/CreateProjectModal';

const App: React.FC = () => {
  const { 
    isIntegrationsModalOpen, 
    closeIntegrationsModal, 
    isAuthenticated,
    isOnboardingActive,
  } = useAppContext();

  return (
    <>
      {isAuthenticated ? <YugnAiHub /> : <LandingPage />}
      <IntegrationsModal isOpen={isIntegrationsModalOpen} onClose={closeIntegrationsModal} />
      <CreateProjectModal />
      {isOnboardingActive && <OnboardingGuide />}
      <ToastContainer />
    </>
  );
};

export default App;
