//Requires
const modulename = 'WebServer:AuthVerify';
const crypto = require('crypto');
const { JWK, JWT } = require('jose');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
//DEBUG: the dev key
// const zapPublicKey = JWK.asKey(`-----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnqysbyFbmOr97wTERsmu
// t2FIHYcOJHn6UDdM824uvQxChcEAtHqv1312pTlLklNxPoVunrwbRrMb6iUuWmsn
// hhNrUiZIemhW2iIR2tZmaxSA5/BgnDUKNOow3kce1EMb8wm/WMohy6+25fgVBIvs
// 1XcXlz6EdUNGiHerF0vOL6yEzfaooLt3tgBrgRPonLwLtm7hMax8+ED1042tL331
// JF4k0DOGTBx3yeAY50jjCabkvvpZn5ATGtK02SnDWVEm/tw2drVJkq2RpnZzuOje
// ffoLza7ofXX3BLgMxc3hFVfPFKWR/84oF+pHzcmQync4F4xb3BL7hUqWgoYMs7SO
// TQIDAQAB
// -----END PUBLIC KEY-----`);

//The actual key
const zapPublicKey = JWK.asKey(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA47Uk3Ly5lWE0PGvF2Uno
xjyN/37+fbtgW7gWnRzfh1hdr7cYk8h+qhtTpP/gjJPLVOTS0FV0zwnWxZaGwgTm
UpjI1Ik2M+wUlvKpcEvFz30fj5/GnzRH5nU1JLSD26qwRCVqzxNrrxS7J+BtNfVC
KK8s/iPYG6TZp/ONyoAt0hicYFnHtoxkcXh+B7xV1AY8drwo287nOAcrXcVQ3wy3
MVNEXJjaF2Y4AcOclRu2kp4tNmyzi4+fVIMuAeUJn4dy7rBa46MDOQQEyu3NdNzt
ef3OFncqQH5WIymLzUSe1UjPbT8iXxVuZVz4JBmDvJv5JnCfp5QVILGzGioP+B3L
0QIDAQAB
-----END PUBLIC KEY-----`);

//NOTE: the routes SHOULD not have any persistent data, but meh...
const usedTokens = new Set();


/**
 * Verify zap token
 * @param {object} ctx
 */
module.exports = async function AuthVerify(ctx) {
    //FIXME: disabled for now
    return ctx.utils.render('login', {
        template: 'normal',
        message: 'ZAP one-click-login temporarily disabled.',
        citizenfxDisabled: !globals.adminVault.providers.citizenfx.ready,
    });

    const errorPrefix = 'Zap JWT error:';
    const renderData = {
        template: 'normal',
        message: 'Invalid token. Please login using one of the options above.',
        citizenfxDisabled: !globals.adminVault.providers.citizenfx.ready,
    };

    //Sanity check
    if (
        isUndefined(ctx.query.token)
        || !GlobalData.isZapHosting
        || !GlobalData.runtimeSecret
        || !GlobalData.defaultMasterAccount
    ) {
        logWarn(`${errorPrefix} Sanity check, precondition failed`);
        return ctx.response.redirect('/');
    }


    //Validating the JWT
    let jwtData;
    try {
        jwtData = JWT.verify(ctx.query.token, zapPublicKey, {
            algorithms: ['RS256'],
            issuer: 'zap-hosting.com',
            maxTokenAge: '5 minutes',
            audience: (GlobalData.forceInterface) ? `${GlobalData.forceInterface}:${GlobalData.txAdminPort}` : undefined,
        });
        if (typeof jwtData.iat !== 'number') throw new Error('missing "iat" claim');
        if (typeof jwtData.sub !== 'string') throw new Error('missing "sub" claim');
        if (typeof jwtData.verifier !== 'string') throw new Error('missing "verifier" claim');
    } catch (error) {
        logWarn(`${errorPrefix} [${error.code}] ${error.message}`);
        return ctx.utils.render('login', renderData);
    }


    //Checking verifier
    try {
        const verifierComposition = [
            jwtData.iat,
            GlobalData.runtimeSecret,
            jwtData.sub,
            GlobalData.defaultMasterAccount.password_hash,
            ctx.ip,
        ].join('|');
        const expectedVerifier = crypto.createHash('sha256').update(verifierComposition).digest('hex');
        if (expectedVerifier !== jwtData.verifier) {
            logWarn(`${errorPrefix} Invalid verifier from ${ctx.ip}`);
            return ctx.utils.render('login', renderData);
        }
    } catch (error) {
        logWarn(`Failed to validate zap token with error: ${error.message}`);
        if (GlobalData.verbose) dir(error);
        renderData.message = 'Error autenticating admin. Please try again.';
        return ctx.utils.render('login', renderData);
    }


    try {
        //Checking admin
        const admin = globals.adminVault.getAdminByName(jwtData.sub);
        if (!admin) {
            logWarn(`${errorPrefix} Wrong username from ${ctx.ip}`);
            return ctx.utils.render('login', renderData);
        }
        if (!admin.master) {
            logWarn(`${errorPrefix} Account is not master from ${ctx.ip}`);
            return ctx.utils.render('login', renderData);
        }

        //Checking if the token was already used
        const signature = ctx.query.token.split('.')[2];
        if (usedTokens.has(signature)) {
            logWarn(`${errorPrefix} Token already used from ${ctx.ip}`);
            return ctx.utils.render('login', renderData);
        }
        usedTokens.add(signature);

        //Setting up session
        const providerWithPicture = Object.values(admin.providers).find((provider) => provider.data && provider.data.picture);
        ctx.session.auth = {
            username: admin.name,
            picture: (providerWithPicture) ? providerWithPicture.data.picture : undefined,
            password_hash: admin.password_hash,
            expires_at: false,
        };

        ctx.utils.logAction(`logged in from ${ctx.ip} via zap token`);
        globals.databus.txStatsData.login.origins[ctx.txVars.hostType]++;
        globals.databus.txStatsData.login.methods.zap++;
    } catch (error) {
        logWarn(`Failed to authenticate ${ctx.request.body.username} with error: ${error.message}`);
        if (GlobalData.verbose) dir(error);
        renderData.message = 'Error autenticating admin.';
        return ctx.utils.render('login', renderData);
    }

    return ctx.response.redirect('/');
};
