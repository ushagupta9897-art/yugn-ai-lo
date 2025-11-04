import React, { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';
import { MarkdownContent } from './MarkdownContent';
import { StopIcon } from '../icons/StopIcon';

const ChatMessage: React.FC<{
  message: ChatMessageType,
  isBeingSpoken?: boolean,
  onStopSpeaking?: () => void
}> = ({ message, isBeingSpoken, onStopSpeaking }) => {
  const isUser = message.sender === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    try {
        const feedbackHistory = JSON.parse(localStorage.getItem('structuredFeedback') || '[]' );
        feedbackHistory.push({
            timestamp: new Date().toISOString(),
            message: message.text,
            feedback: type
        });
        localStorage.setItem('structuredFeedback', JSON.stringify(feedbackHistory));
    } catch (e) {
        console.error("Failed to save structured feedback:", e);
    }
  };

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          Y
        </div>
        <div className="bg-slate-100 dark:bg-surface-dark rounded-lg p-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : ''} animate-fade-in-up group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold font-heading text-sm flex-shrink-0">
          Y
        </div>
      )}
      <div className="flex-grow max-w-xl">
        <div className={`rounded-lg p-3.5 text-sm leading-relaxed ${isUser ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-surface-dark text-primary-text-light dark:text-primary-text-dark'}`}>
          <MarkdownContent content={message.text} />
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 border-t border-slate-200/50 dark:border-border-dark pt-3">
              <h4 className="text-xs font-semibold mb-2 text-subtle-text-light dark:text-subtle-text-dark">Sources from the Web</h4>
              <div className="grid grid-cols-1 gap-2">
                  {message.sources.filter(source => source.web && source.web.uri && source.web.title).map((source, index) => (
                      <a
                          key={index}
                          href={source.web!.uri!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white/50 dark:bg-dark/50 p-2 rounded-md hover:bg-white dark:hover:bg-dark transition-colors text-xs"
                      >
                          <div className={`font-semibold truncate ${isUser ? 'text-indigo-200' : 'text-secondary'}`}>{source.web!.title}</div>
                          <div className={`${isUser ? 'text-slate-200/80' : 'text-slate-400'} truncate mt-0.5`}>{source.web!.uri}</div>
                      </a>
                  ))}
              </div>
            </div>
          )}
        </div>
        {!isUser && (
            <div className="mt-2 flex items-center gap-2 h-6">
                {isBeingSpoken ? (
                     <button
                        onClick={onStopSpeaking}
                        className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 transition animate-fade-in"
                        aria-label="Stop speaking"
                    >
                        <StopIcon className="w-3 h-3" />
                        Stop
                    </button>
                ) : (
                    <div className="transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-2">
                        {feedbackGiven ? (
                            <p className="text-xs text-subtle-text-light dark:text-subtle-text-dark">Thanks for your feedback!</p>
                        ) : (
                            <>
                                <button onClick={() => handleFeedback('positive')} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" aria-label="Good response">👍</button>
                                <button onClick={() => handleFeedback('negative')} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" aria-label="Bad response">👎</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
      {isUser && (
         <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold font-heading text-sm flex-shrink-0">
          You
        </div>
      )}
    </div>
  );
};

export default ChatMessage;