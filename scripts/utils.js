//Requires
const url = require('url');

//Export postJson()
exports.postJson = (targetURL, data) => {
    return new Promise((resolve, reject) => {
        const lib = targetURL.startsWith('https') ? require('https') : require('http');
        let parsedURL = url.parse(targetURL)

        const reqOptions = {
            hostname: parsedURL.hostname,
            port: parsedURL.port,
            path: parsedURL.pathname,
            method: 'POST',
            timeout: 1000,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }
        const request = lib.request(reqOptions, (res) => {
            res.setEncoding('utf8');
            const body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', () => resolve({statusCode: res.statusCode, body: body.join('')}));
        });

        request.on('timeout', () => {
            request.abort();
            reject(new Error('request timed out'))
        })
        request.on('error', () => {
            request.abort();
        })

        request.write(data);
        request.end();
    })
};
