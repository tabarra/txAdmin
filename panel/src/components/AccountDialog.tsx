import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent, DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/auth";
import { useEffect, useState } from "react";
import { TabsTrigger, TabsList, TabsContent, Tabs } from "@/components/ui/tabs";
import { ApiChangePasswordReq } from "@shared/authApiTypes";
import { useAccountModal } from "@/hooks/dialogs";
import { GenericApiResp } from "@shared/genericApiTypes";
import { useBackendApi } from "@/hooks/useBackendApi";
import consts from "@shared/consts";
import { txToast } from "./TxToaster";



/**
 * Change Password tab
 */
function ChangePasswordTab() {
    const { authData, setAuthData } = useAuth();
    const { setAccountModalOpen, setAccountModalTab } = useAccountModal();
    const changePasswordApi = useBackendApi<GenericApiResp, ApiChangePasswordReq>({
        method: 'POST',
        path: '/changePassword'
    });

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (!authData) return;
        setError('');

        if (newPassword.length < consts.adminPasswordMinLength || newPassword.length > consts.adminPasswordMaxLength) {
            setError(`The password must be between ${consts.adminPasswordMinLength} and ${consts.adminPasswordMaxLength} digits long.`);
            return;
        } else if (newPassword !== newPasswordConfirm) {
            setError('The passwords do not match.');
            return;
        }

        setIsSaving(true);
        changePasswordApi({
            data: {
                newPassword,
                oldPassword: authData.isTempPassword ? undefined : oldPassword,
            },
            error: (error) => {
                setIsSaving(false);
                setError(error);
            },
            success: (data) => {
                setIsSaving(false);
                if ('logout' in data) return;
                if ('success' in data) {
                    if (authData.isTempPassword) {
                        setAccountModalTab('identifiers');
                        setAuthData({
                            ...authData,
                            isTempPassword: false,
                        });
                    } else {
                        txToast.success('Password changed successfully!');
                        setAccountModalOpen(false);
                    }
                } else {
                    setError(data.error)
                }
            }
        });
    };

    if (!authData) return;
    return (
        <TabsContent value="password" tabIndex={undefined}>
            <form onSubmit={handleSubmit}>
                {authData.isTempPassword ? (<p className="text-sm text-warning">
                    Your account has a temporary password that needs to be changed before you can use this web panel. <br />
                    <strong>Make sure to take note of your new password before saving.</strong>
                </p>) : (<p className="text-sm text-muted-foreground">
                    You can use your password to login to the txAdmin inferface even without using the Cfx.re login button.
                </p>)}
                <div className="space-y-2 pt-2 pb-6">
                    {!authData.isTempPassword && (
                        <div className="space-y-1">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                placeholder="Enter new password"
                                type="password"
                                value={oldPassword}
                                autoFocus
                                required
                                onChange={(e) => {
                                    setOldPassword(e.target.value);
                                    setError('');
                                }}
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            autoComplete="new-password"
                            placeholder="Enter new password"
                            type="password"
                            value={newPassword}
                            autoFocus={authData.isTempPassword}
                            required
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setError('');
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                            id="confirm-password"
                            autoComplete="new-password"
                            placeholder="Repeat new password"
                            type="password"
                            required
                            onChange={(e) => {
                                setNewPasswordConfirm(e.target.value);
                                setError('');
                            }}
                        />
                    </div>
                </div>

                {error && <p className="text-destructive text-center -mt-2 mb-4">{error}</p>}
                <Button
                    className="w-full"
                    type="submit"
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : authData.isTempPassword ? 'Save & Next' : 'Change Password'}
                </Button>
            </form>
        </TabsContent>
    );
}


/**
 * Change Identifiers tab
 */
function ChangeIdentifiersTab() {
    return (
        <TabsContent value="identifiers" tabIndex={undefined}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </TabsContent>
    );
}


/**
 * Account Dialog
 */
export default function AccountDialog() {
    const { authData } = useAuth();
    const {
        isAccountModalOpen, setAccountModalOpen,
        accountModalTab, setAccountModalTab
    } = useAccountModal();

    useEffect(() => {
        if (!authData) return;
        if (authData.isTempPassword) {
            setAccountModalOpen(true);
            setAccountModalTab('password');
        }
    }, []);

    const dialogSetIsClose = (newState: boolean) => {
        if (!newState && authData && !authData.isTempPassword) {
            setAccountModalOpen(false);
            setTimeout(() => {
                setAccountModalTab('password');
            }, 500);
        }
    }

    if (!authData) return;
    return (
        <Dialog
            open={isAccountModalOpen}
            onOpenChange={dialogSetIsClose}
        >
            <DialogContent className="sm:max-w-lg" tabIndex={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {authData.isTempPassword ? 'Welcome to txAdmin!' : `Your Account - ${authData.name}`}
                    </DialogTitle>
                </DialogHeader>

                <Tabs
                    defaultValue="password"
                    value={accountModalTab}
                    onValueChange={setAccountModalTab}
                >
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="password">Password</TabsTrigger>
                        <TabsTrigger value="identifiers" disabled={authData.isTempPassword}>Identifiers</TabsTrigger>
                    </TabsList>
                    <ChangePasswordTab />
                    <ChangeIdentifiersTab />
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
