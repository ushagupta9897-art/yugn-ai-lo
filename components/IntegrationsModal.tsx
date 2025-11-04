import React, { useEffect, useRef } from 'react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlatformConnect: React.FC<{
  name: string;
  description: string;
  logo: string;
}> = ({ name, description, logo }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-surface-dark/60 rounded-lg">
      <div className="flex items-center gap-4">
        <span className="text-3xl">{logo}</span>
        <div>
          <h4 className="font-bold">{name}</h4>
          <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">{description}</p>
        </div>
      </div>
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-secondary-text-light dark:text-secondary-text-dark">
        Coming Soon
      </span>
    </div>
  );
};

const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) { // Shift+Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up" 
        aria-labelledby="modal-title" 
        role="dialog" 
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-2xl p-8 transform transition-all"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-start">
            <div>
                <h2 id="modal-title" className="text-2xl font-bold">
                    Connect Your Ad Platforms
                </h2>
                <p className="mt-1 text-secondary-text-light dark:text-secondary-text-dark">
                    Sync your campaign data in real-time for automated analysis.
                </p>
            </div>
            <button onClick={onClose} className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary-text-light dark:hover:text-primary-text-dark text-2xl" aria-label="Close integrations modal">&times;</button>
        </div>

        <div className="mt-8 space-y-4">
            <PlatformConnect name="Google Ads" description="Connect Google & YouTube" logo="📊" />
            <PlatformConnect name="Meta Ads" description="Connect Facebook & Instagram" logo="📘" />
            <PlatformConnect name="LinkedIn Ads" description="Connect your LinkedIn account" logo="💼" />
        </div>
        
        <div className="mt-8 text-center">
            <button onClick={onClose} className="px-6 py-2 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsModal;