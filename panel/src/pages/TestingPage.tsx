import InputTest from "@/components/InputTest";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import { useLocation } from "wouter";

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
        xxxxxxxxxx
    </div>;
}
