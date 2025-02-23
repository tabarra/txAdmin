import MarkdownProse from "@/components/MarkdownProse";
import { CustomToast } from "@/components/TxToaster";
import type { Toast } from "react-hot-toast";

const testMarkdown = `
# h1
## h2
### h3

**bold** *italic* __underline__ ~~strikethrough~~
\`inline code\`

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

const toastProps: Omit<Toast, 'type' | 'id'> = {
    pauseDuration: 0,
    dismissed: false,
    ariaProps: {
        role: "status",
        "aria-live": "polite",
    },
    createdAt: Date.now(),
    message: "Loading...",
    visible: true,
};
const toastMarkdown = `
**Unable to start the server due to error(s) in your config file(s):**
\`E:\\FiveM\\txData\\CFXDefault\\server.cfg\`:
- Line 19: the \`endpoint_add_tcp\` port MUST be \`30150\`.
- Line 20: the \`endpoint_add_udp\` port MUST be \`30150\`.
- Your config file does not specify a valid endpoints for FXServer to use. Please delete all \`endpoint_add_*\` lines and add the following to the start of the file:
	- \`endpoint_add_tcp "0.0.0.0:30150"\`
	- \`endpoint_add_udp "0.0.0.0:30150"\`

**Some of the configuration above is controlled by Host Config.**

\`\`\`js
//Just to test code block inside toast
const hello = () => {
    return \`Hello World!\`;
}
\`\`\`
`;
const toatData = {
    title: 'Test Title',
    md: true,
    msg: toastMarkdown,
};

export default function TmpMarkdown() {
    return (<>
        <div className="border p-4 rounded-lg">
            <MarkdownProse md={testMarkdown} />
        </div>
        <div className="flex flex-wrap gap-4 items-start">
            <CustomToast
                t={{
                    ...toastProps,
                    id: "test-toast",
                    type: "error",
                }}
                type="error"
                data={toatData}
            />
            <CustomToast
                t={{
                    ...toastProps,
                    id: "test-toast",
                    type: "success",
                }}
                type="success"
                data={toatData}
            />
        </div>
    </>);
}
