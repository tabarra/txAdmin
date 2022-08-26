const modulename = 'WebServer:DeployerStepper';
import fse from 'fs-extra';
import logger from '@core/extras/console.js';
import { convars } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the deployer stepper page (all 3 stages)
 * @param {object} ctx
 */
export default async function DeployerStepper(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('master', modulename)) {
        return ctx.utils.render('main/message', { message: 'You need to be the admin master to use the deployer.' });
    }

    //Check if this is the correct state for the deployer
    if (globals.deployer == null) {
        const redirPath = (!globals.fxRunner.config.cfgPath || !globals.fxRunner.config.serverDataPath) ? '/setup' : '/';
        return ctx.response.redirect(redirPath);
    }

    //Prepare Output
    const renderData = {
        step: globals.deployer.step,
        serverProfile: globals.info.serverProfile,
        deploymentID: globals.deployer.deploymentID,
        requireDBConfig: false,
        defaultLicenseKey: '',
        recipe: undefined,
        defaults: {},
    };

    if (globals.deployer.step === 'review') {
        renderData.recipe = {
            isTrustedSource: globals.deployer.isTrustedSource,
            name: globals.deployer.recipe.name,
            version: globals.deployer.recipe.version,
            author: globals.deployer.recipe.author,
            description: globals.deployer.recipe.description,
            raw: globals.deployer.recipe.raw,
        };
    } else if (globals.deployer.step === 'input') {
        renderData.defaultLicenseKey = process.env.TXADMIN_DEFAULT_LICENSE || '';
        renderData.requireDBConfig = globals.deployer.recipe.requireDBConfig;
        if (convars.deployerDefaults) {
            renderData.defaults = {
                autofilled: true,
                license: convars.deployerDefaults.license || '',
                mysqlHost: convars.deployerDefaults.mysqlHost || 'localhost',
                mysqlPort: convars.deployerDefaults.mysqlPort || '3306',
                mysqlUser: convars.deployerDefaults.mysqlUser || 'root',
                mysqlPassword: convars.deployerDefaults.mysqlPassword || '',
                mysqlDatabase: convars.deployerDefaults.mysqlDatabase || globals.deployer.deploymentID,
            };
        } else {
            renderData.defaults = {
                autofilled: false,
                license: process.env.TXADMIN_DEFAULT_LICENSE || '',
                mysqlHost: 'localhost',
                mysqlUser: 'root',
                mysqlPort: '3306',
                mysqlPassword: '',
                mysqlDatabase: globals.deployer.deploymentID,
            };
        }

        const recipeVars = globals.deployer.getRecipeVars();
        renderData.inputVars = Object.keys(recipeVars).map((name) => {
            return {
                name: name,
                value: recipeVars[name],
            };
        });
    } else if (globals.deployer.step === 'run') {
        renderData.deployPath = globals.deployer.deployPath;
    } else if (globals.deployer.step === 'configure') {
        const errorMessage = `# This recipe didn't create the ./server.cfg for you, meaning the process likely failed.
# Please make sure everything is correct, or insert here the contents of the ./server.cfg
# (╯°□°）╯︵ ┻━┻`;
        try {
            renderData.serverCFG = await fse.readFile(`${globals.deployer.deployPath}/server.cfg`, 'utf8');
            if (renderData.serverCFG == '#save_attempt_please_ignore' || !renderData.serverCFG.length) {
                renderData.serverCFG = errorMessage;
            } else if (renderData.serverCFG.length > 10240) { //10kb
                renderData.serverCFG = `# This recipe created a ./server.cfg above 10kb, meaning its probably the wrong data. 
Make sure everything is correct in the recipe and try again.`;
            }
        } catch (error) {
            if (convars.verbose) dir(error);
            renderData.serverCFG = errorMessage;
        }
    } else {
        return ctx.utils.render('main/message', { message: 'Unknown Deployer step, please report this bug and restart txAdmin.' });
    }

    return ctx.utils.render('standalone/deployer', renderData);
};
