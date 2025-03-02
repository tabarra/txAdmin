import fs from 'node:fs';
import esbuild from 'esbuild';
import {
    copyStaticFiles,
    getPublishVersion,
    licenseBanner,
} from './utils';


//Detect the tag/version and set the .cienv file
const { txVersion, isPreRelease, preReleaseExpiration } = getPublishVersion(false);
fs.writeFileSync('.github/.cienv', `TX_IS_PRERELEASE=${isPreRelease}\n`);

//Copy static files
console.log('Starting txAdmin Prod Builder');
copyStaticFiles('./dist/', txVersion, 'publish');
//yarn.installed Needs to be older than the package.json
fs.writeFileSync('./dist/.yarn.installed', '');
fs.writeFileSync('./dist/package.json', '{"type":"commonjs"}');
fs.writeFileSync('./dist/LICENSE.txt', licenseBanner());

//Transpile & bundle core
try {
    const { errors } = esbuild.buildSync({
        entryPoints: ['./core'],
        bundle: true,
        outfile: './dist/core/index.js',
        platform: 'node',
        target: 'node16',
        format: 'cjs', //typescript builds to esm and esbuild converts it to cjs
        minifyWhitespace: true,
        charset: 'utf8',
        define: { TX_PRERELEASE_EXPIRATION: preReleaseExpiration },
        banner: { js: licenseBanner(undefined, true) },
        //To satisfy the license's "full text" requirement, it will be generated 
        //by another npm script and it is referenced in the banner.
        legalComments: 'none',
    });
    if (errors.length) {
        console.log(`[BUNDLER] Failed with ${errors.length} errors.`);
        process.exit(1);
    }
} catch (error) {
    console.log('[BUNDLER] Errored out :(');
    console.dir(error);
    process.exit(1);
}
console.log('Publish task finished :)');
