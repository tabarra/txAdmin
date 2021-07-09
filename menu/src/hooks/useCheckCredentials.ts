import { useSetPermissions } from "../state/permissions.state";
import { debugLog } from "../utils/debugLog";
import { useEffect } from "react";
import { fetchNuiAuth } from "../utils/fetchNuiAuth";

export const useCheckCredentials = () => {
  const setPermsState = useSetPermissions();
  useEffect(() => {
    fetchNuiAuth()
      .then(setPermsState)
      .catch((e) => {
        if (!process.env.IN_GAME) {
          debugLog(
            "Browser AuthData",
            "Detected browser mode, dispatching mock auth data",
            "WebPipeReq"
          );
          setPermsState({
            expiration: 100000,
            isAdmin: true,
            permissions: ["all_permissions"],
            luaToken: "xxxx_Debug_Token_xxx",
          });
          return;
        }

        throw e;
      });
  }, []);
};
