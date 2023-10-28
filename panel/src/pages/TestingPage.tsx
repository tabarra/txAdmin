import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import { useLocation } from "wouter";

export default function TestingPage() {
    const { authData, setAuthData, logout } = useAuth();
    const [location, setLocation] = useLocation();

    const doLogout = () => {
        logout.mutate();
    }

    return (
        <pre>
            {JSON.stringify(authData, null, 2)}
            <br />
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
        </pre>

    );
}
