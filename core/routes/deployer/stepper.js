const modulename = 'WebServer:DeployerStepper';
import fse from 'fs-extra';
import { convars, txDevEnv, txEnv } from '@core/globalData';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the deployer stepper page (all 3 stages)
 * @param {object} ctx
 */
export default async function DeployerStepper(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('master')) {
        return ctx.utils.render('main/message', { message: 'You need to be the admin master to use the deployer.' });
    }

    //Check if this is the correct state for the deployer
    if (txManager.deployer == null) {
        const redirPath = (!txConfig.fxRunner.cfgPath || !txConfig.fxRunner.serverDataPath)
            ? '/server/setup'
            : '/';
        return ctx.utils.legacyNavigateToPage(redirPath);
    }

    //Prepare Output
    const renderData = {
        step: txManager.deployer.step,
        serverProfile: txEnv.profile,
        deploymentID: txManager.deployer.deploymentID,
        requireDBConfig: false,
        defaultLicenseKey: '',
        recipe: undefined,
        defaults: {},
    };

    if (txManager.deployer.step === 'review') {
        renderData.recipe = {
            isTrustedSource: txManager.deployer.isTrustedSource,
            name: txManager.deployer.recipe.name,
            author: txManager.deployer.recipe.author,
            description: txManager.deployer.recipe.description,
            raw: txManager.deployer.recipe.raw,
        };
    } else if (txManager.deployer.step === 'input') {
        renderData.defaultLicenseKey = txDevEnv.CFXKEY ?? '';
        renderData.requireDBConfig = txManager.deployer.recipe.requireDBConfig;
        if (convars.deployerDefaults) {
            renderData.defaults = {
                autofilled: true,
                license: convars.deployerDefaults.license ?? '',
                mysqlHost: convars.deployerDefaults.mysqlHost ?? 'localhost',
                mysqlPort: convars.deployerDefaults.mysqlPort ?? '3306',
                mysqlUser: convars.deployerDefaults.mysqlUser ?? 'root',
                mysqlPassword: convars.deployerDefaults.mysqlPassword ?? '',
                mysqlDatabase: convars.deployerDefaults.mysqlDatabase ?? txManager.deployer.deploymentID,
            };
        } else {
            renderData.defaults = {
                autofilled: false,
                license: txDevEnv.CFXKEY ?? '',
                mysqlHost: 'localhost',
                mysqlUser: 'root',
                mysqlPort: '3306',
                mysqlPassword: '',
                mysqlDatabase: txManager.deployer.deploymentID,
            };
        }

        const knownVarDescriptions = {
            steam_webApiKey: 'The Steam Web API Key is used to authenticate players when they join.<br/>\nYou can get one at https://steamcommunity.com/dev/apikey.',
        }
        const recipeVars = txManager.deployer.getRecipeVars();
        renderData.inputVars = Object.keys(recipeVars).map((name) => {
            return {
                name: name,
                value: recipeVars[name],
                description: knownVarDescriptions[name] || '',
            };
        });
    } else if (txManager.deployer.step === 'run') {
        renderData.deployPath = txManager.deployer.deployPath;
    } else if (txManager.deployer.step === 'configure') {
        const errorMessage = `# server.cfg Not Found!
# This probably means you deleted it before pressing "Next".
# Press cancel and start the deployer again,
# or insert here the server.cfg contents.
# (╯°□°）╯︵ ┻━┻`;
        try {
            renderData.serverCFG = await fse.readFile(`${txManager.deployer.deployPath}/server.cfg`, 'utf8');
            if (renderData.serverCFG == '#save_attempt_please_ignore' || !renderData.serverCFG.length) {
                renderData.serverCFG = errorMessage;
            } else if (renderData.serverCFG.length > 10240) { //10kb
                renderData.serverCFG = `# This recipe created a ./server.cfg above 10kb, meaning its probably the wrong data. 
Make sure everything is correct in the recipe and try again.`;
            }
        } catch (error) {
            console.verbose.dir(error);
            renderData.serverCFG = errorMessage;
        }
    } else {
        return ctx.utils.render('main/message', { message: 'Unknown Deployer step, please report this bug and restart txAdmin.' });
    }

    return ctx.utils.render('standalone/deployer', renderData);
};
