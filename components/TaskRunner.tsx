
import React from 'react';
import type { Task } from '../types';
import Spinner from './Spinner';
import { CheckIcon } from './icons/CheckIcon';

interface TaskRunnerProps {
    tasks: Task[];
}

const TaskRunner: React.FC<TaskRunnerProps> = ({ tasks }) => {
    
    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'running':
                return <Spinner size="small" className="w-5 h-5 text-primary" />;
            case 'complete':
                return <CheckIcon className="w-5 h-5 text-success" />;
            case 'pending':
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />;
        }
    };

    const getStatusTextColor = (status: Task['status'], isOptional?: boolean) => {
        if (isOptional && status === 'complete') {
            return 'text-secondary-text-light dark:text-secondary-text-dark line-through';
        }
        switch (status) {
             case 'running':
                return 'text-primary dark:text-blue-300 font-semibold';
            case 'complete':
                return 'text-success dark:text-emerald-400 line-through';
            case 'pending':
            default:
                return 'text-secondary-text-light dark:text-secondary-text-dark';
        }
    }

    return (
        <div className="mt-8 p-6 bg-slate-50 dark:bg-surface-dark/60 rounded-xl border border-border-light dark:border-border-dark max-w-lg mx-auto">
            <div className="space-y-4">
                {tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex-shrink-0">
                            {getStatusIcon(task.status)}
                        </div>
                        <p className={`text-base ${getStatusTextColor(task.status, task.isOptional)}`}>
                            {task.name} {task.isOptional && task.status === 'complete' && '(Not Required)'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskRunner;
