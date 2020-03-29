//Require
const xssClass = require('xss');


/**
 * Returns a function with the passed whitelist parameter.
 * https://github.com/leizongmin/js-xss#whitelist
 */
module.exports = (customWL = []) => {
    const xss = new xssClass.FilterXSS({
        whiteList: customWL
    });
    return (x) => {return xss.process(x)};
}
