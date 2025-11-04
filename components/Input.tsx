import React from 'react';

type InputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  // FIX: Added 'date' to support the native date picker input type.
  type?: 'text' | 'select' | 'textarea' | 'number' | 'date';
  placeholder?: string;
  children?: React.ReactNode;
  startAdornment?: React.ReactNode;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
};

const Input: React.FC<InputProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  children,
  startAdornment,
  onBlur,
  onKeyDown,
}) => {
  const baseClasses = "w-full p-3 bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-light dark:focus:bg-surface-dark transition-all duration-200 placeholder:text-subtle-text-light dark:placeholder:text-subtle-text-dark";
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(e.target.id, e.target.value);
  };

  const hasAdornment = !!startAdornment;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark mb-1.5">
        {label}
      </label>
      {type === 'select' ? (
        <select id={id} value={value} onChange={handleChange} onBlur={onBlur} onKeyDown={onKeyDown} className={`${baseClasses} ${!value ? 'text-secondary-text-light dark:text-secondary-text-dark' : ''}`}>
          {children}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          className={baseClasses}
          placeholder={placeholder}
          rows={3}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      ) : (
        <div className="relative">
          {hasAdornment && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-secondary-text-light dark:text-secondary-text-dark sm:text-sm">
                {startAdornment}
              </span>
            </div>
          )}
          <input
            type={type}
            id={id}
            value={value}
            onChange={handleChange}
            className={`${baseClasses} ${hasAdornment ? 'pl-8' : ''}`}
            placeholder={placeholder}
            onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
            onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLInputElement>}
          />
        </div>
      )}
    </div>
  );
};

export default Input;
