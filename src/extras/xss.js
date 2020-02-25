//Require
const xssClass = require('xss');

// console.dir(xss.whiteList)
//Set custom xss rules


module.exports = (incWL = []) => {
    const xss = new xssClass.FilterXSS({
        whiteList: incWL
    });
    return (x) => {return xss.process(x)}
}
