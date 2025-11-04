import React from 'react';

export const FlaskIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ id = "lab-icon", ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-labelledby={id} {...props}>
        <title id={id}>Resonance Lab Icon</title>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 5.25a5.236 5.236 0 0 0-4.242 2.156l-5.32 8.513A5.25 5.25 0 0 0 9.75 21h4.5a5.25 5.25 0 0 0 5.092-5.081l-5.32-8.513A5.236 5.236 0 0 0 14.25 5.25Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 8.25h3M9 12h6" />
    </svg>
);