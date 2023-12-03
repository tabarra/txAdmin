import { openExternalLink, stripIndent } from '@/lib/utils';
import Markdown, { Components } from 'react-markdown';
import InlineCode from './InlineCode';
import { ExternalLink } from 'lucide-react';
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
    return <button onClick={onClick} className="text-accent no-underline hover:underline">
        {children}
        {isExternal && <ExternalLink className="inline ml-1 mb-1" />}
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
};
export default function MarkdownProse({ md }: Props) {
    return (
        <Markdown components={customComponents} className="prose dark:prose-invert">
            {stripIndent(md.replace(/\n/g, '  \n'))}
        </Markdown>
    );
}
