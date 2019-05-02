//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'WebServer:getHash';


/**
 * Simple way to get a bcrypt hash to populate your admins.json
 * Just access http://localhost:40120/getHash?pwd=YourPasswordHere (might be different, of course)
 * @param {object} res
 * @param {object} req
 */
module.exports = async function getHash(res, req) {
    let pwd = req.query.pwd;
    let hash = globals.authenticator.hash(pwd);
    res.send(`<pre>Password Hash: \n${hash}</pre>`);
};
