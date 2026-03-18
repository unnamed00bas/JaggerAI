import ReactMarkdown from 'react-markdown'

interface MarkdownMessageProps {
  content: string
  className?: string
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none
      prose-headings:text-inherit prose-headings:font-semibold
      prose-h2:text-sm prose-h2:mt-3 prose-h2:mb-1
      prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1
      prose-p:my-1 prose-p:leading-relaxed
      prose-ul:my-1 prose-ol:my-1
      prose-li:my-0 prose-li:leading-relaxed
      prose-strong:text-inherit
      prose-code:text-xs prose-code:bg-black/10 dark:prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      ${className}`}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
