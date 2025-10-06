import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

/**
 * LinkRenderer component for displaying text content with properly rendered links
 * 
 * This component takes text content and automatically converts URLs, emails, and domain names
 * into clickable links while ensuring they are fully visible and not truncated.
 * 
 * Features:
 * - Automatically detects and converts URLs, emails, and domain names to clickable links
 * - Prevents link truncation with proper word breaking
 * - Maintains accessibility with proper link attributes
 * - Supports custom styling through className prop
 * 
 * @param text - The text content to render with links
 * @param className - Additional CSS classes to apply
 * @param maxWidth - Maximum width before wrapping (default: none)
 */
interface LinkRendererProps {
  text: string;
  className?: string;
  maxWidth?: string;
}

export function LinkRenderer({ text, className, maxWidth }: LinkRendererProps) {
  // Enhanced regex to detect URLs, emails, and domain names
  const linkRegex = /(\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+|\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b[a-zA-Z0-9-]+\.(com|net|org|co\.in|in|io|dev|ai|app|me|xyz|info|edu|gov|us|uk|co|ca|de|fr|jp|au|br|cn|ru|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|sk|si|ee|lv|lt|mt|cy|lu|ie|pt|gr|be|at|ch|is|li|mc|ad|sm|va|mt|cy|lu|ie|pt|gr|be|at|ch|is|li|mc|ad|sm|va)\b)/gi;

  const renderTextWithLinks = (input: string): React.ReactNode[] => {
    const parts = input.split(linkRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      // Check if this part is a URL
      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all hover:underline-offset-2 transition-colors"
            style={{ wordBreak: 'break-all' }}
          >
            {part}
          </a>
        );
      }
      
      // Check if this part is a www URL
      if (/^www\./.test(part)) {
        return (
          <a
            key={index}
            href={`http://${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all hover:underline-offset-2 transition-colors"
            style={{ wordBreak: 'break-all' }}
          >
            {part}
          </a>
        );
      }
      
      // Check if this part is an email
      if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part)) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all hover:underline-offset-2 transition-colors"
            style={{ wordBreak: 'break-all' }}
          >
            {part}
          </a>
        );
      }
      
      // Check if this part is a domain name
      if (/^[a-zA-Z0-9-]+\.(com|net|org|co\.in|in|io|dev|ai|app|me|xyz|info|edu|gov|us|uk|co|ca|de|fr|jp|au|br|cn|ru|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|sk|si|ee|lv|lt|mt|cy|lu|ie|pt|gr|be|at|ch|is|li|mc|ad|sm|va)$/i.test(part)) {
        return (
          <a
            key={index}
            href={`http://${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all hover:underline-offset-2 transition-colors"
            style={{ wordBreak: 'break-all' }}
          >
            {part}
          </a>
        );
      }
      
      // Regular text
      return <span key={index}>{part}</span>;
    }).filter(Boolean);
  };

  return (
    <div 
      className={cn(
        "break-words overflow-wrap-anywhere",
        className
      )}
      style={{ 
        maxWidth: maxWidth || 'none',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere'
      }}
    >
      {renderTextWithLinks(text)}
    </div>
  );
}

/**
 * LinkRendererCell component specifically for table cells
 * 
 * This component is optimized for use in table cells where space is limited
 * but links need to be fully visible and clickable.
 */
interface LinkRendererCellProps {
  text: string;
  className?: string;
  title?: string;
}

export function LinkRendererCell({ text, className, title }: LinkRendererCellProps) {
  return (
    <div 
      className={cn(
        "break-words overflow-wrap-anywhere min-w-0",
        className
      )}
      style={{ 
        wordBreak: 'break-word',
        overflowWrap: 'anywhere'
      }}
      title={title || text}
    >
      <LinkRenderer text={text} />
    </div>
  );
}
