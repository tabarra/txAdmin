import MarkdownProse from "@/components/MarkdownProse";

const testMarkdown = `
# h1
## h2
### h3

**bold** *italic* __underline__ ~~strikethrough~~

list:
- item 1
- item 2
- item 3
    - item 3.1
    - item 3.2

> blockquote

\`\`\`js
console.log('code block');
\`\`\`

[external link](https://google.com)
[internal link](/server/server-log)
`;

export default function TmpMarkdown() {
    return <MarkdownProse md={testMarkdown} />;
}
