import { cn, openExternalLink, stripIndent } from '@/lib/utils';
import Markdown, { Components } from 'react-markdown';
import InlineCode from './InlineCode';
import { ExternalLinkIcon } from 'lucide-react';
import { useLocation } from 'wouter';

function CustomAnchor({ href, children }: { href?: string, children: React.ReactNode }) {
    const setLocation = useLocation()[1];
    const isExternal = href?.startsWith('http');
    const onClick = () => {
        if (!href) return;
        if (isExternal) {
            openExternalLink(href);
        } else {
            setLocation(href ?? '/');
        }
    }
    return <button onClick={onClick} className="text-accent no-underline hover:underline m-0">
        {children}
        {isExternal && <ExternalLinkIcon className="inline ml-1 mb-1 h-5 [.prose-sm_&]:h-4 [.prose-sm_&]:ml-0" />}
    </button>
}

// NOTE: we might not even need this
// https://tailwindcss.com/docs/typography-plugin#advanced-topics
const customComponents: Components = {
    // blockquote: ({ children }) => <blockquote className="border-l-4 border-pink-600 pl-2">{children}</blockquote>,
    code: ({ children }) => <InlineCode className="not-prose">{children}</InlineCode>,
    pre: ({ children }) => <pre className="not-prose bg-muted p-2 rounded">{children}</pre>,
    a: ({ children, href }) => <CustomAnchor href={href}>{children}</CustomAnchor>,
}


type Props = {
    md: string;
    isSmall?: boolean;
    isTitle?: boolean;
};
export default function MarkdownProse({ md, isSmall, isTitle }: Props) {
    return (
        <Markdown
        components={customComponents}
        className={cn(
            'prose prose-zinc dark:prose-invert',
            isSmall && 'prose-sm',
            isTitle && 'tracking-wide',
        )}
        >
            {stripIndent(md.replace(/\n/g, '  \n'))}
        </Markdown>
    );
}
