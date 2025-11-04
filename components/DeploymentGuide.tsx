import React, { useState, useEffect } from 'react';
import type { MarketingAnalysis, PlatformStrategy, Persona } from '../types';

interface DeploymentGuideProps {
    strategy: MarketingAnalysis;
    personas: Persona[];
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-secondary-text-light dark:text-secondary-text-dark font-semibold py-1 px-2 rounded-md transition">
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};

const GuideSection: React.FC<{ title: string; children: React.ReactNode; copyText?: string; }> = ({ title, children, copyText }) => (
    <div className="bg-slate-50 dark:bg-surface-dark/60 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-sm text-primary-text-light dark:text-primary-text-dark">{title}</h4>
            {copyText && <CopyButton textToCopy={copyText} />}
        </div>
        <div className="text-sm text-secondary-text-light dark:text-secondary-text-dark space-y-2">{children}</div>
    </div>
);

const PlatformDetails: React.FC<{ platformStrategy: PlatformStrategy; personas: Persona[] }> = ({ platformStrategy, personas }) => {
    const { contentFocus, adStrategy, suggestedAdFormats, keyMetricsToWatch, googleAdsKeywords } = platformStrategy;
    
    // FIX: Add robust safety checks for all potentially missing arrays to prevent crashes.
    const formats = suggestedAdFormats || [];
    const metrics = keyMetricsToWatch || [];

    return (
        <div className="space-y-3 animate-fade-in">
            {contentFocus && (
                <GuideSection title="Content Focus" copyText={contentFocus}>
                    <p>{contentFocus}</p>
                </GuideSection>
            )}
            {adStrategy && (
                <GuideSection title="Ad Strategy" copyText={adStrategy}>
                    <p>{adStrategy}</p>
                </GuideSection>
            )}
            {['meta', 'facebook', 'instagram'].some(p => platformStrategy.platformName.toLowerCase().includes(p)) && personas && (
                <GuideSection title="Meta Ads Audience Targeting">
                    <div className="space-y-4">
                        {personas.map(persona => (
                            <div key={persona.name} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <h5 className="font-semibold text-xs mb-2 text-primary">{persona.name}</h5>
                                {persona.metaTargeting && (
                                    <div className="space-y-2">
                                        {persona.metaTargeting.directInterests?.length > 0 && (
                                            <div>
                                                <h6 className="text-xs font-semibold text-subtle-text-light dark:text-subtle-text-dark">Direct Interests</h6>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {persona.metaTargeting.directInterests.map(kw => <span key={kw} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5">{kw}</span>)}
                                                </div>
                                            </div>
                                        )}
                                        {persona.metaTargeting.indirectInterests?.length > 0 && (
                                            <div>
                                                <h6 className="text-xs font-semibold text-subtle-text-light dark:text-subtle-text-dark">Indirect Interests</h6>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {persona.metaTargeting.indirectInterests.map(kw => <span key={kw} className="text-xs bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-full px-2 py-0.5">{kw}</span>)}
                                                </div>
                                            </div>
                                        )}
                                        {persona.metaTargeting.behaviors?.length > 0 && (
                                            <div>
                                                <h6 className="text-xs font-semibold text-subtle-text-light dark:text-subtle-text-dark">Behaviors</h6>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {persona.metaTargeting.behaviors.map(kw => <span key={kw} className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full px-2 py-0.5">{kw}</span>)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </GuideSection>
            )}
             {platformStrategy.platformName.toLowerCase().includes('linkedin') && personas && (
                <GuideSection title="LinkedIn Ads Audience Targeting">
                    <p className="text-xs mb-3">Target users based on the following demographic attributes identified in your target personas:</p>
                    <div className="space-y-4">
                        {personas.map(persona => (
                            <div key={persona.name} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <h5 className="font-semibold text-xs mb-2 text-primary">{persona.name}</h5>
                                <ul className="list-disc pl-5 text-xs text-secondary-text-light dark:text-secondary-text-dark space-y-1">
                                    {persona.demographics.map(d => <li key={d}>{d}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </GuideSection>
            )}
            {googleAdsKeywords && (googleAdsKeywords.keywordGroups || []).length > 0 && (
                <GuideSection title="Google Ads Keyword Strategy">
                    <div className="space-y-4">
                        {(googleAdsKeywords.keywordGroups || []).map((group, index) => (
                            <div key={index} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <h5 className="font-semibold text-sm text-primary-text-light dark:text-primary-text-dark">{group.theme}</h5>
                                <p className="text-xs italic text-secondary-text-light dark:text-secondary-text-dark mb-3">{group.justification}</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-border-light dark:border-border-dark">
                                            <tr className="text-subtle-text-light dark:text-subtle-text-dark">
                                                <th className="py-1 pr-2 font-semibold">Keyword</th>
                                                <th className="py-1 px-2 font-semibold text-center">Match Type</th>
                                                <th className="py-1 pl-2 font-semibold text-center">Intent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(group.keywords || []).map((kw, kwIndex) => (
                                                <tr key={kwIndex} className="border-b border-border-light dark:border-border-dark last:border-0 text-primary-text-light dark:text-primary-text-dark">
                                                    <td className="py-1.5 pr-2 font-mono text-primary-text-light dark:text-primary-text-dark">{kw.keyword}</td>
                                                    <td className="py-1.5 px-2 text-center text-primary-text-light dark:text-primary-text-dark">{kw.matchType}</td>
                                                    <td className="py-1.5 pl-2 text-center text-primary-text-light dark:text-primary-text-dark">{kw.intent}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                        {(googleAdsKeywords.negativeKeywords || []).length > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg mt-4">
                                <h5 className="font-semibold text-sm text-red-700 dark:text-red-300">Negative Keywords</h5>
                                <p className="text-xs italic text-red-600 dark:text-red-400 mb-2">Add these to your campaigns to avoid irrelevant clicks.</p>
                                <div className="flex flex-wrap gap-2">
                                    {(googleAdsKeywords.negativeKeywords || []).map((kw, index) => (
                                        <span key={index} className="bg-slate-200 dark:bg-slate-700 rounded-full px-3 py-1 text-xs font-medium text-red-500 line-through">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </GuideSection>
            )}
            {formats.length > 0 && (
                <GuideSection title="Suggested Ad Formats" copyText={formats.join(', ')}>
                    <div className="flex flex-wrap gap-2">
                        {formats.map(format => (
                            <span key={format} className="bg-slate-200 dark:bg-slate-700 rounded-full px-3 py-1 text-xs font-medium">{format}</span>
                        ))}
                    </div>
                </GuideSection>
            )}
            {metrics.length > 0 && (
                <GuideSection title="Key Metrics to Watch" copyText={metrics.join(', ')}>
                    <ul className="list-disc pl-5">
                        {metrics.map(metric => <li key={metric}>{metric}</li>)}
                    </ul>
                </GuideSection>
            )}
        </div>
    );
};


const DeploymentGuide: React.FC<DeploymentGuideProps> = ({ strategy, personas }) => {
    const recommendedPlatforms = strategy.platformRecommendations || [];
    const [activePlatformName, setActivePlatformName] = useState<string>('');

    // This effect ensures that an active platform is always selected,
    // especially on initial load or when the strategy recommendations change.
    useEffect(() => {
        const platformExists = recommendedPlatforms.some(p => p.platformName === activePlatformName);
        
        if (!platformExists && recommendedPlatforms.length > 0) {
            // If current selection is invalid (e.g., on first load), set to the first platform.
            setActivePlatformName(recommendedPlatforms[0].platformName);
        } else if (recommendedPlatforms.length === 0) {
            // Clear selection if there are no platforms.
            setActivePlatformName('');
        }
    }, [strategy.platformRecommendations, activePlatformName]);

    if (recommendedPlatforms.length === 0) {
        return null; // Don't render if no platforms are recommended
    }

    const activePlatformStrategy = recommendedPlatforms.find(p => p.platformName === activePlatformName);
    
    return (
        <div className="mt-8 border-t-2 border-border-light dark:border-border-dark pt-6 no-print">
            <h3 className="text-2xl font-bold font-heading mb-4">🚀 Deployment Guide</h3>
            <p className="text-secondary-text-light dark:text-secondary-text-dark mb-4 max-w-3xl">Use this section to quickly copy and paste the strategic details into your ad platforms.</p>
            <div className="border-b border-border-light dark:border-border-dark">
                <nav className="-mb-px flex space-x-2 pb-1 overflow-x-auto" aria-label="Tabs">
                    {recommendedPlatforms.map(platform => (
                         <button
                            key={platform.platformName}
                            onClick={() => setActivePlatformName(platform.platformName)}
                            className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activePlatformName === platform.platformName ? 'bg-surface-light dark:bg-surface-dark text-primary' : 'bg-transparent text-secondary-text-light dark:text-secondary-text-dark hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            {platform.platformName}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="bg-slate-100 dark:bg-surface-dark/50 p-6 rounded-b-lg min-h-[120px]">
                {activePlatformStrategy ? (
                    <PlatformDetails platformStrategy={activePlatformStrategy} personas={personas} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                         <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">Loading deployment details...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeploymentGuide;