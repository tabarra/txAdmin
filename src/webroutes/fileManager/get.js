//Requires
const webUtils = require('../webUtils.js');
const context = 'WebServer:FileManager';
const fs = require('fs')
const humanizeDuration = require('humanize-duration');

const supportedEdit = {
    js: 'javascript',
    lua: 'lua',
    md: 'markdown',
    cfg: 'fivem-cfg',
    yml: 'yaml',
    html: 'html',
    css: 'css',
    txt: 's-rst'
}

/**
 * Returns Rounded Number
 * @param {number} number 
 * @param {number} digits 
 */
function roundNumber(number, digits) {
    return Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits);
}

/**
 * Returns File Size in readable format (1 KB)
 * @param {number} size
 */
function humanizeFileSize(size) {
    let gigaBytes = size * 0.000000000931322574615478515625; // Linting issues with 11 Digits 
    let megaBytes = size / 1048576 - (Math.floor(gigaBytes) * 1024);
    let kiloBytes = size / 1024 - Math.floor((Math.floor(gigaBytes) * 1024) + megaBytes) * 1024;
    let bytes = size - (Math.floor((Math.floor(gigaBytes) * 1024) + megaBytes) * 1024) * 1024;

    let formatedString = '';

    Math.round()
    if (gigaBytes >= 1)
        formatedString = roundNumber(gigaBytes, 2) + ' GB';
    else if (megaBytes >= 1)
        formatedString = roundNumber(megaBytes, 2) + ' MB'
    else if (kiloBytes >= 1)
        formatedString = roundNumber(kiloBytes, 2) + ' KB'
    else
        formatedString = bytes + ' B'

    return formatedString;
}

/**
 * Returns the output page containing the live console
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Check permissions
    if(!webUtils.checkPermission(req, 'files.all', context)){
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    let filePath = req.originalUrl.length > 12 ? req.originalUrl.substring(12) : '/';

    let baseDirectory = globals.configVault.configFile.fxRunner.basePath + filePath;

    if (!baseDirectory) {
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `Base Path has not been set.`});
        return res.send(out);
    }

    if (!fs.existsSync(baseDirectory)) {
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `Folder / File does not exist`});
        return res.send(out);
    }

    if (!fs.statSync(baseDirectory).isDirectory()) {     

        let fileType = baseDirectory.split('/');
        fileType = fileType[fileType.length - 1].split('.')[1].toLowerCase().trim();

        if (typeof supportedEdit[fileType] === 'undefined') {
            let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `File Type not supported.`});
            return res.send(out);
        }

        let renderData = {
            headerTitle: 'File Manager - Edit',
            rawFile: fs.readFileSync(baseDirectory),
            fileType: supportedEdit[fileType]
        };
    
        let out = await webUtils.renderMasterView('fileManager-edit', req.session, renderData);

        return res.send(out);
    }

    let files = fs.readdirSync(baseDirectory);

    let filesData = [];

    let humanizeOptions = {
        language: globals.translator.t('$meta.humanizer_language'),
        round: true,
        units: ['d', 'h', 'm'],
        fallbacks: ['en']
    }

    let currentTime = new Date().getTime();

    for (let file of files) {
        let stats = fs.statSync(`${baseDirectory}/${file}`);
        filesData.push({ fileName: file, isDirectory: stats.isDirectory(),
            fileSize: stats.isDirectory() ? -1 : humanizeFileSize(stats.size), lastModified: humanizeDuration(stats.mtime.getTime() - currentTime, humanizeOptions) });
    }

    let directoryPath = filePath.split('/');
    if (directoryPath.length > 2) {
        directoryPath = directoryPath.slice(directoryPath.length - 2, directoryPath.length);
        directoryPath = '../' + directoryPath.join('/');
    } else {
        directoryPath = filePath;
    }
    
    let renderData = {
        headerTitle: 'File Manager - View',
        directory: directoryPath,
        currentFiles: filesData,
        disabledBack: filePath.length === 1 ? 'disabled' : ''
    }

    let out = await webUtils.renderMasterView('fileManager-view', req.session, renderData);
    return res.send(out);
};
