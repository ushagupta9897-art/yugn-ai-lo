
import React, { useState } from 'react';
import Card from './Card';
import type { Persona } from '../types';
import { ChevronDownIcon } from './icons/ChevronIcons';
import { DatabaseIcon } from './icons/DatabaseIcon';

const ThumbUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-2.942c-.523 0-.848-.555-.523-.898.27-.602.173-.405.27-.602.197-.4-.078-.898-.523-.898h2.942c.523 0 .848.555.523.898-.27.602-.173.405-.27.602.197.4.078.898.523.898h2.942c.523 0 .848.555.523.898Z" />
  </svg>
);

const ThumbDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904M10.598 5.5H14.25M5.904 18.5c.083-.205.173-.405.27-.602.197-.4-.078-.898-.523-.898h-2.942c-.523 0-.848-.555-.523-.898.27-.602.173-.405.27-.602.197-.4-.078-.898-.523-.898h2.942c.523 0 .848.555.523.898-.27.602-.173.405-.27-.602.197.4.078.898.523.898h2.942c.523 0 .848.555.523.898Z" />
  </svg>
);


export const PersonaCard: React.FC<{ persona: Persona; className?: string }> = ({ persona, className = '' }) => {
    const [isShowingSources, setIsShowingSources] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'none' | 'approved' | 'rejected'>('none');

    const hasSources = persona.groundingSources && persona.groundingSources.length > 0;

    return (
        <Card className={`flex-1 min-w-[300px] max-w-md flex flex-col ${className}`}>
            <div className="flex-grow">
                <h4 className="text-lg font-bold font-heading text-primary">{persona.name} ({persona.age})</h4>
                <div className="mt-4 space-y-3 text-sm">
                    <p><strong>Demographics:</strong> {persona.demographics.join(', ')}</p>
                    <p><strong>Pain Points:</strong> {persona.painPoints.join(', ')}</p>
                    <p><strong>Interests:</strong> {persona.interests.join(', ')}</p>
                    <p><strong>Platforms:</strong> {persona.platforms.join(', ')}</p>
                    {persona.metaTargeting && (
                        <div>
                            <strong>Meta Ads Targeting:</strong>
                            <div className="space-y-2 mt-1">
                                {persona.metaTargeting.directInterests?.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-semibold text-subtle-text-light dark:text-subtle-text-dark">Direct Interests</h5>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {persona.metaTargeting.directInterests.map(kw => <span key={kw} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5">{kw}</span>)}
                                        </div>
                                    </div>
                                )}
                                {persona.metaTargeting.indirectInterests?.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-semibold text-subtle-text-light dark:text-subtle-text-dark">Indirect Interests</h5>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {persona.metaTargeting.indirectInterests.map(kw => <span key={kw} className="text-xs bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-full px-2 py-0.5">{kw}</span>)}
                                        </div>
                                    </div>
                                )}
                                {persona.metaTargeting.behaviors?.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-semibold text-subtle-text-light dark:text-subtle-text-dark">Behaviors</h5>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {persona.metaTargeting.behaviors.map(kw => <span key={kw} className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full px-2 py-0.5">{kw}</span>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-auto pt-4 space-y-3">
                {hasSources && (
                    <div className="border-t border-border-light dark:border-border-dark pt-3">
                        <button
                            onClick={() => setIsShowingSources(!isShowingSources)}
                            className="w-full flex justify-between items-center text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark hover:text-primary-text-light dark:hover:text-primary-text-dark transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <DatabaseIcon className="w-4 h-4" />
                                View Data Sources
                            </span>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isShowingSources ? 'rotate-180' : ''}`} />
                        </button>
                        {isShowingSources && (
                            <div className="mt-3 space-y-2 animate-fade-in-up">
                                {persona.groundingSources?.map((source, index) => (
                                    <a
                                        key={index}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-2 bg-slate-50 dark:bg-surface-dark/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <p className="text-xs font-semibold text-primary truncate">{source.url}</p>
                                        <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark mt-0.5 italic">
                                            Justification: {source.justification}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                 <div className="border-t border-border-light dark:border-border-dark pt-3 flex items-center justify-end gap-2">
                    <span className="text-xs font-semibold text-secondary-text-light dark:text-secondary-text-dark mr-2">This looks right?</span>
                    <button 
                        onClick={() => setValidationStatus(validationStatus === 'approved' ? 'none' : 'approved')}
                        className={`p-2 rounded-full transition-colors ${validationStatus === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        aria-label="Approve persona"
                    >
                        <ThumbUpIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setValidationStatus(validationStatus === 'rejected' ? 'none' : 'rejected')}
                        className={`p-2 rounded-full transition-colors ${validationStatus === 'rejected' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        aria-label="Reject persona"
                    >
                        <ThumbDownIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </Card>
    );
};
