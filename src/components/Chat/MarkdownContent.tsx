

import React from 'react';

/**
 * A simple but more secure sanitizer for AI-generated content.
 * It first escapes all critical HTML characters to prevent XSS,
 * then safely applies minimal markdown formatting.
 * 
 * **SECURITY CRITICAL:** This function is the primary defense against Cross-Site Scripting (XSS) attacks
 * from potentially malicious AI-generated output. The model's output MUST be treated as untrusted user input.
 * The sanitization step ensures that any injected HTML or script tags are rendered as inert text
 * by the browser, rather than being executed.
 * 
 * @param text The raw text from the AI.
 * @returns Sanitized HTML string.
 */
const sanitizeAndFormat = (text: string): string => {
  if (typeof text !== 'string') {
    console.error("MarkdownContent received a non-string value. This is a bug. Value:", text);
    return ''; // Return empty string to prevent crash
  }

  // 1. Sanitize: Escape all potentially harmful characters.
  // This is the most important step for preventing XSS.
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // 2. Format: Apply safe, known markdown transformations AFTER sanitization.
  // Using a more robust regex for bold that avoids issues with multiple asterisks.
  let html = sanitizedText.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>');
  
  // Replace newlines with <br> tags for proper line breaks.
  html = html.replace(/\n/g, '<br />');

  return html;
};

/**
 * Renders AI-generated content after sanitizing it to prevent XSS attacks.
 * Supports basic markdown like **bold** and newlines.
 * This component is a security-critical boundary for the application.
 */
export const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  const createMarkup = () => {
    return { __html: sanitizeAndFormat(content) };
  };

  return <div dangerouslySetInnerHTML={createMarkup()} />;
};
