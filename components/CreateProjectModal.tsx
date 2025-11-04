import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const CreateProjectModal: React.FC = () => {
    const { isCreateProjectModalOpen, closeCreateProjectModal, createProject } = useAppContext();
    const [projectName, setProjectName] = useState('');

    const handleCreate = () => {
        if (projectName.trim()) {
            createProject(projectName.trim());
            setProjectName('');
            closeCreateProjectModal();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreate();
        }
    };

    if (!isCreateProjectModalOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={closeCreateProjectModal}
        >
            <div 
                className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">Create New Project</h2>
                <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark mb-1.5">
                        Project Name
                    </label>
                    <input
                        type="text"
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Q4 SaaS Campaign"
                        className="w-full p-3 bg-slate-100 dark:bg-slate-900/50 border-2 border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-surface-light dark:focus:bg-surface-dark transition-all"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={closeCreateProjectModal} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={!projectName.trim()} className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50">
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProjectModal;