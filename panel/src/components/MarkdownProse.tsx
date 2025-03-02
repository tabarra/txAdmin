import { cn, stripIndent } from '@/lib/utils';
import Markdown, { Components } from 'react-markdown';
import InlineCode from './InlineCode';
import TxAnchor from './TxAnchor';


// NOTE: we might not even need this
// https://tailwindcss.com/docs/typography-plugin#advanced-topics
const customComponents: Components = {
    // blockquote: ({ children }) => <blockquote className="border-l-4 border-pink-600 pl-2">{children}</blockquote>,
    code: ({ children }) => <InlineCode className="not-prose [.prose-toast_&:not(pre_*)]:bg-muted/65">{children}</InlineCode>,
    pre: ({ children }) => <pre className="not-prose p-2 whitespace-pre-wrap [overflow-wrap:_anywhere] break-all rounded bg-muted [.prose-toast_&]:bg-muted/65 [.prose-toast_&>code]:bg-transparent">{children}</pre>,
    a: ({ children, href }) => <TxAnchor href={href!}>{children}</TxAnchor>,
}


type MarkdownProseProps = {
    md: string;
    isSmall?: boolean;
    isTitle?: boolean;
    isToast?: boolean;
};
export default function MarkdownProse({ md, isSmall, isTitle, isToast }: MarkdownProseProps) {
    return (
        <Markdown
            components={customComponents}
            className={cn(
                'prose dark:prose-invert prose-zinc',
                isSmall && 'prose-sm',
                isTitle && 'tracking-wide',
                isToast && 'prose-toast',
            )}
        >
            {stripIndent(md.replace(/\n/g, '  \n'))}
        </Markdown>
    );
}
