
import React, { useState, useLayoutEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

// Helper function to get arrow styles based on placement
const getArrowStyles = (placement: 'top' | 'bottom' | 'left' | 'right' | 'center'): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        width: '12px',
        height: '12px',
        background: 'inherit',
        transform: 'rotate(45deg)',
        zIndex: -1,
    };

    switch (placement) {
        case 'top': return { ...baseStyles, bottom: '-6px', left: '50%', marginLeft: '-6px' };
        case 'bottom': return { ...baseStyles, top: '-6px', left: '50%', marginLeft: '-6px' };
        case 'left': return { ...baseStyles, right: '-6px', top: '50%', marginTop: '-6px' };
        case 'right':
        default: return { ...baseStyles, left: '-6px', top: '50%', marginTop: '-6px' };
    }
};


export const OnboardingGuide: React.FC = () => {
  const {
    currentOnboardingStepIndex,
    onboardingSteps,
    endOnboarding,
    goToNextOnboardingStep,
    goToPrevOnboardingStep,
  } = useAppContext();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = onboardingSteps[currentOnboardingStepIndex];

  useLayoutEffect(() => {
    if (currentStep.targetId) {
        const targetElement = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            setTargetRect(rect);
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        } else {
            console.warn(`Onboarding target not found: ${currentStep.targetId}`);
            setTargetRect(null); // Fallback to centered
        }
    } else {
        setTargetRect(null); // Centered step
    }
  }, [currentStep.targetId, currentOnboardingStepIndex]);

  const getPopoverPosition = (): React.CSSProperties => {
    if (!targetRect) { // Centered
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    
    const margin = 16;
    switch (currentStep.placement) {
      case 'top':
        return { bottom: `${window.innerHeight - targetRect.top + margin}px`, left: `${targetRect.left + targetRect.width / 2}px`, transform: 'translateX(-50%)' };
      case 'bottom':
        return { top: `${targetRect.bottom + margin}px`, left: `${targetRect.left + targetRect.width / 2}px`, transform: 'translateX(-50%)' };
      case 'left':
        return { top: `${targetRect.top + targetRect.height / 2}px`, right: `${window.innerWidth - targetRect.left + margin}px`, transform: 'translateY(-50%)' };
      case 'right':
      default:
        return { top: `${targetRect.top + targetRect.height / 2}px`, left: `${targetRect.right + margin}px`, transform: 'translateY(-50%)' };
    }
  };

  const highlightStyle: React.CSSProperties = targetRect
    ? {
        position: 'absolute',
        top: `${targetRect.top - 4}px`,
        left: `${targetRect.left - 4}px`,
        width: `${targetRect.width + 8}px`,
        height: `${targetRect.height + 8}px`,
        boxShadow: '0 0 0 500vmax rgba(15, 23, 42, 0.7)',
        outline: '2px solid white',
        borderRadius: '12px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 1,
      }
    : {
        opacity: 0,
        top: '50%', left: '50%', width: 0, height: 0,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      };
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    transition: 'opacity 0.4s ease-in-out',
    opacity: targetRect ? 0 : 1,
    pointerEvents: targetRect ? 'none' : 'auto',
  };


  return (
    <div className="fixed inset-0 z-[10000]" aria-live="polite">
      <div style={overlayStyle} onClick={endOnboarding} />
      
      <div style={highlightStyle} />

      <div
        key={currentOnboardingStepIndex}
        style={getPopoverPosition()}
        className="fixed bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-sm z-[10001] transition-all duration-300 animate-fade-in-down"
        role="dialog"
        aria-labelledby="onboarding-title"
      >
        {targetRect && <div style={getArrowStyles(currentStep.placement)} />}
        
        <div className="flex justify-between items-center mb-3">
            <h3 id="onboarding-title" className="text-xl font-bold">{currentStep.title}</h3>
            <span className="text-xs font-bold text-secondary-text-light dark:text-secondary-text-dark bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                {currentOnboardingStepIndex + 1} / {onboardingSteps.length}
            </span>
        </div>

        <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mb-5">{currentStep.content}</p>

        <div className="flex justify-between items-center">
            <button onClick={endOnboarding} className="text-xs font-semibold text-secondary-text-light dark:text-secondary-text-dark hover:underline">
                Skip Tour
            </button>
            <div className="flex items-center gap-2">
                <button
                    onClick={goToPrevOnboardingStep}
                    disabled={currentOnboardingStepIndex === 0}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={goToNextOnboardingStep}
                    className="px-5 py-2 text-sm text-white font-semibold rounded-lg bg-primary hover:bg-primary-hover transition-all shadow-md shadow-primary/30"
                    data-is-last-step={(currentOnboardingStepIndex === onboardingSteps.length - 1).toString()}
                >
                    {currentOnboardingStepIndex === onboardingSteps.length - 1 ? "Finish" : "Next"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
