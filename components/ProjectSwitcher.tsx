import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

const ProjectSwitcher: React.FC = () => {
    const { projects, activeProjectId, setActiveProjectId, getActiveProject, openCreateProjectModal } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const activeProject = getActiveProject();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSelect = (id: string) => {
        setActiveProjectId(id);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 rounded-lg text-sm font-semibold transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <span className="truncate flex-1 text-left">{activeProject?.name || "No Project"}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-20 animate-fade-in-down">
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {projects.map(project => (
                            <button
                                key={project.id}
                                onClick={() => handleSelect(project.id)}
                                className={`w-full text-left p-2 text-sm rounded-md truncate ${
                                    project.id === activeProjectId 
                                    ? 'bg-primary/10 text-primary font-semibold' 
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {project.name}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-border-light dark:border-border-dark p-2">
                        <button 
                            onClick={() => { openCreateProjectModal(); setIsOpen(false); }}
                            className="w-full text-left p-2 text-sm font-semibold rounded-md text-primary hover:bg-primary/10"
                        >
                            + Create New Project
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectSwitcher;