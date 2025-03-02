const modulename = 'WebServer:AuthLogout';
import { InitializedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { ApiLogoutResp } from '@shared/authApiTypes';
const console = consoleFactory(modulename);


/**
 * Once upon a cyber-time, in the land of API wonder, there was a humble route called 'AuthLogout'.
 * It was the epitome of simplicity, with just a single line of code. In a project brimming with
 * complexity, this little route stood as a beacon of uncomplicated grace. It dutifully ensured
 * that users could bid farewell to txAdmin with ease, never overstaying its welcome.
 * And so, with a single request, users embarked on their journeys, leaving behind the virtual
 * realm, 😄👋 #ByeFelicia
 */
export default async function AuthLogout(ctx: InitializedCtx) {
    ctx.sessTools.destroy();

    return ctx.send<ApiLogoutResp>({
        logout: true,
    });
};
