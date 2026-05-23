import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownBodyProps {
  children: string
  className?: string
}

export function MarkdownBody({ children, className }: MarkdownBodyProps) {
  return (
    <div className={cn('text-[#F4F0FF]/75', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        p: ({ children }) => (
          <p className="mt-3 text-sm leading-6 first:mt-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[#F4F0FF]">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[#F4F0FF]/75">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="mt-3 space-y-1.5 first:mt-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-3 space-y-1.5 list-none first:mt-0">{children}</ol>
        ),
        li: ({ children, ...props }) => {
          const isOrdered = (props as { ordered?: boolean }).ordered
          return (
            <li className="flex items-start gap-2 text-sm leading-6">
              {isOrdered ? (
                <span className="mt-[3px] shrink-0 font-mono text-[10px] tabular-nums text-[#8B5CF6]/50">
                  {String((props as { index?: number }).index ?? 0 + 1).padStart(2, '0')}
                </span>
              ) : (
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#8B5CF6]/60" />
              )}
              <span>{children}</span>
            </li>
          )
        },
        blockquote: ({ children }) => (
          <blockquote className="mt-3 border-l-2 border-[#8B5CF6]/40 pl-4 first:mt-0">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-[#8B5CF6]">
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8B5CF6] underline underline-offset-2 transition hover:text-[#A78BFA]"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="mt-3 overflow-x-auto first:mt-0">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-white/10">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="transition-colors hover:bg-white/[0.03]">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#8B5CF6]/70">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2.5 leading-relaxed text-[#F4F0FF]/70">{children}</td>
        ),
      }}
        >
          {children}
        </ReactMarkdown>
    </div>
  )
}
