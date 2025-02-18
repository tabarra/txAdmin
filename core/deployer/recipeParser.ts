const modulename = 'Deployer';
import YAML from 'js-yaml';
import { txEnv } from '@core/globalData';
import { default as untypedRecipeEngine } from './recipeEngine.js';
import consoleFactory from '@lib/console.js';
import { RECIPE_DEPLOYER_VERSION } from './index.js'; //FIXME: circular_dependency
const console = consoleFactory(modulename);


//Types
type YamlRecipeTaskType = {
    action: string;
    [key: string]: any;
}
type YamlRecipeType = Partial<{
    $engine: number;
    $minFxVersion: number;
    $onesync: string;
    $steamRequired: boolean;

    name: string;
    author: string;
    description: string;

    variables: Record<string, any>;
    tasks: YamlRecipeTaskType[];
}>;
type ParsedRecipeType = {
    raw: string;
    name: string;
    author: string;
    description: string;
    variables: Record<string, any>; //TODO: define this
    tasks: YamlRecipeTaskType[];
    onesync?: string;
    fxserverMinVersion?: number;
    recipeEngineVersion?: number;
    steamRequired?: boolean;
    requireDBConfig: boolean;
}


//FIXME: move to the recipeEngine.js file after typescript migration
type RecipeEngineTask = {
    validate: (task: YamlRecipeTaskType) => boolean;
    run: (options: YamlRecipeTaskType, basePath: string, deployerCtx: unknown) => Promise<void>;
    timeoutSeconds: number;
};
type RecipeEngine = Record<string, RecipeEngineTask>;
const recipeEngine = untypedRecipeEngine as RecipeEngine;


/**
 * Validates a Recipe file
 * FIXME: use Zod for schema validaiton
 */
const recipeParser = (rawRecipe: string) => {
    if (typeof rawRecipe !== 'string') throw new Error('not a string');

    //Loads YAML
    let recipe: YamlRecipeType;
    try {
        recipe = YAML.load(rawRecipe, { schema: YAML.JSON_SCHEMA }) as YamlRecipeType;
    } catch (error) {
        console.verbose.dir(error);
        throw new Error('invalid yaml');
    }

    //Basic validation
    if (typeof recipe !== 'object') throw new Error('invalid YAML, couldn\'t resolve to object');
    if (!Array.isArray(recipe.tasks)) throw new Error('no tasks array found');

    //Preparing output
    const outRecipe: ParsedRecipeType = {
        raw: rawRecipe.trim(),
        name: (recipe.name ?? 'unnamed').trim(),
        author: (recipe.author ?? 'unknown').trim(),
        description: (recipe.description ?? '').trim(),
        variables: {},
        tasks: [],
        requireDBConfig: false,
    };

    //Checking/parsing meta tag requirements
    if (typeof recipe.$onesync == 'string') {
        const onesync = recipe.$onesync.trim();
        if (!['off', 'legacy', 'on'].includes(onesync)) throw new Error(`the onesync option selected required for this recipe ("${onesync}") is not supported by this FXServer version.`);
        outRecipe.onesync = onesync;
    }
    if (typeof recipe.$minFxVersion == 'number') {
        if (recipe.$minFxVersion > txEnv.fxsVersion) throw new Error(`this recipe requires FXServer v${recipe.$minFxVersion} or above`);
        outRecipe.fxserverMinVersion = recipe.$minFxVersion; //NOTE: currently no downstream use
    }
    if (typeof recipe.$engine == 'number') {
        if (recipe.$engine < RECIPE_DEPLOYER_VERSION) throw new Error(`unsupported '$engine' version ${recipe.$engine}`);
        outRecipe.recipeEngineVersion = recipe.$engine; //NOTE: currently no downstream use
    }
    if (recipe.$steamRequired === true) {
        outRecipe.steamRequired = true;
    }

    //Validate tasks
    if (!Array.isArray(recipe.tasks)) throw new Error('no tasks array found');
    recipe.tasks.forEach((task, index) => {
        if (typeof task.action !== 'string') throw new Error(`[task${index + 1}] no action specified`);
        if (typeof recipeEngine[task.action] === 'undefined') throw new Error(`[task${index + 1}] unknown action '${task.action}'`);
        if (!recipeEngine[task.action].validate(task)) throw new Error(`[task${index + 1}:${task.action}] invalid parameters`);
        outRecipe.tasks.push(task);
    });

    //Process inputs
    outRecipe.requireDBConfig = recipe.tasks.some((t) => t.action.includes('database'));
    const protectedVarNames = ['licenseKey', 'dbHost', 'dbUsername', 'dbPassword', 'dbName', 'dbConnection', 'dbPort'];
    if (typeof recipe.variables == 'object' && recipe.variables !== null) {
        const varNames = Object.keys(recipe.variables);
        if (varNames.some((n) => protectedVarNames.includes(n))) {
            throw new Error('One or more of the variables declared in the recipe are not allowed.');
        }
        Object.assign(outRecipe.variables, recipe.variables);
    }

    //Output
    return outRecipe;
};

export default recipeParser;
