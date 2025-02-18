import xssClass from 'xss';


/**
 * Returns a function with the passed whitelist parameter.
 * https://github.com/leizongmin/js-xss#whitelist
 */
export default (customWL = []) => {
    const xss = new xssClass.FilterXSS({
        whiteList: customWL,
    });
    return (x) => xss.process(x);
};
