import MarkdownProse from "@/components/MarkdownProse";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import { LuPersonStanding } from "react-icons/lu";

const testMarkdown = `
# h1
## h2
### h3
#### h4
##### h5
###### h6

**bold**
*italic*
__underline__
~~strikethrough~~

list:
- item 1
- item 2
- item 3
    - item 3.1
    - item 3.2

1. item 1
2. item 2
3. item 3
    1. item 3.1
    2. item 3.2

> blockquote

\`\`\`js
console.log('code block');
\`\`\`

[external link](https://google.com)
[internal link](/server/server-log)

`;

export default function TestingPage() {
    const { authData, setAuthData, logout } = useAuth();

    const doLogout = () => {
        logout.mutate();
    }

    return <div className="flex flex-col gap-4 w-full">
        <pre>
            {JSON.stringify(authData, null, 2)}
        </pre>
        <hr />
        {authData && (
            <div className="flex gap-3">
                <Button onClick={() => setAuthData({
                    ...authData,
                    isMaster: !authData.isMaster,
                })}>
                    Toggle isMaster
                </Button>
                <Button onClick={() => setAuthData(false)}>
                    Erase Auth
                </Button>
                <Button onClick={doLogout}>
                    Logout
                </Button>
            </div>
        )}
        <hr />
        <div className="space-x-4">
            <Button size="sm">Lorem</Button>
            <Button variant="secondary" size="sm">Lorem</Button>
            <Button variant="destructive" size="sm">Lorem</Button>
            <Button variant="outline" size="sm">Lorem</Button>
            <Button variant="ghost" size="sm">Lorem</Button>
            <Button variant="link" size="sm">Lorem</Button>
            <Button variant="outline" size="icon"><LuPersonStanding /></Button>
            <Button size="sm"><LuPersonStanding /> Player</Button>
            <Button size="sm" disabled>Lorem</Button>
        </div>
        <hr />
        <MarkdownProse md={testMarkdown} />
    </div>;
}
