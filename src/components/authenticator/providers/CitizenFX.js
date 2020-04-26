//Requires
const modulename = 'Authenticator:CitizenFXProvider';
const crypto  = require('crypto');
const { Issuer, custom } = require('openid-client');
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);


module.exports = class CitizenFXProvider {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.ready = false;

        this.setClient();
    }


    //================================================================
    /**
     * Do OpenID Connect auto-discover on CitizenFX endpoint
     */
    async setClient(){
        try {
            // FIXME: ask zirconium to fix the IdM
            // let fivemIssuer = await Issuer.discover('https://idms.fivem.net/.well-known/openid-configuration');
            let fivemIssuer = new Issuer({"issuer":"https://idms.fivem.net","jwks_uri":"https://idms.fivem.net/.well-known/openid-configuration/jwks","authorization_endpoint":"https://idms.fivem.net/connect/authorize","token_endpoint":"https://idms.fivem.net/connect/token","userinfo_endpoint":"https://idms.fivem.net/connect/userinfo","end_session_endpoint":"https://idms.fivem.net/connect/endsession","check_session_iframe":"https://idms.fivem.net/connect/checksession","revocation_endpoint":"https://idms.fivem.net/connect/revocation","introspection_endpoint":"https://idms.fivem.net/connect/introspect","device_authorization_endpoint":"https://idms.fivem.net/connect/deviceauthorization","frontchannel_logout_supported":true,"frontchannel_logout_session_supported":true,"backchannel_logout_supported":true,"backchannel_logout_session_supported":true,"scopes_supported":["openid","email","identify","offline_access"],"claims_supported":["sub","email","email_verified","nameid","name","picture","profile"],"grant_types_supported":["authorization_code","client_credentials","refresh_token","implicit","urn:ietf:params:oauth:grant-type:device_code"],"response_types_supported":["code","token","id_token","id_token token","code id_token","code token","code id_token token"],"response_modes_supported":["form_post","query","fragment"],"token_endpoint_auth_methods_supported":["client_secret_basic","client_secret_post"],"subject_types_supported":["public"],"id_token_signing_alg_values_supported":["RS256"],"code_challenge_methods_supported":["plain","S256"],"request_parameter_supported":true});

            this.client = new fivemIssuer.Client({
                client_id: 'txadmin_test',
                client_secret: 'txadmin_test',
                response_types: ['openid']
            });
            this.client[custom.clock_tolerance] = 2*60*60; //Two hours due to the DST change. Reduce to 300s.
            custom.setHttpOptionsDefaults({
                timeout: 4500,
            });
            if(GlobalData.verbose) log('CitizenFX Provider configured.');
            this.ready = true;
        } catch (error) {
            logError(`Failed to create client with error: ${error.message}`);
        }
    }


    //================================================================
    /**
     * Returns the Provider Auth URL
     * @param {string} state
     * @param {string} redirectUri
     * @returns {(string)} the auth url or throws an error
     */
    async getAuthURL(redirectUri, stateKern){
        if(!this.ready) throw new Error(`${modulename} is not ready`);

        let stateSeed = `txAdmin:${stateKern}`;
        let state = crypto.createHash('SHA1').update(stateSeed).digest("hex");
        let url = await this.client.authorizationUrl({
            redirect_uri: redirectUri,
            state: state,
            response_type: 'code',
            scope: 'openid identify'
        });
        if(typeof url !== 'string') throw new Error('url is not string');
        return url;
    }


    //================================================================
    /**
     * Processes the callback and returns the tokenSet
     * @param {object} ctx
     * @param {string} redirectUri the redirect uri originally used
     * @param {string} stateKern
     * @returns {(object)} tokenSet or throws an error
     */
    async processCallback(ctx, redirectUri, stateKern){
        if(!this.ready) throw new Error(`${modulename} is not ready`);

        //Process the request
        let params = this.client.callbackParams(ctx);
        if(typeof params.code == 'undefined') throw new Error('code not present');

        //Check the state
        let stateSeed = `txAdmin:${stateKern}`;
        let stateExpected = crypto.createHash('SHA1').update(stateSeed).digest("hex");

        //Exchange code for token
        let tokenSet = await this.client.callback(redirectUri, params, {state: stateExpected});
        if(typeof tokenSet !== 'object') throw new Error('tokenSet is not an object');
        if(typeof tokenSet.access_token == 'undefined') throw new Error('access_token not present');
        if(typeof tokenSet.expires_at == 'undefined') throw new Error('expires_at not present');
        return tokenSet;
    }


    //================================================================
    /**
     * Processes the callback and returns the tokenSet
     * @param {string} accessToken
     * @returns {(string)} userInfo or throws an error
     */
    async getUserInfo(accessToken){
        if(!this.ready) throw new Error(`${modulename} is not ready`);

        //Perform introspection
        let userInfo = await this.client.userinfo(accessToken);
        if(typeof userInfo !== 'object') throw new Error('userInfo is not an object');
        if(typeof userInfo.name != 'string' && !userInfo.name.length) throw new Error('name not present');
        if(typeof userInfo.picture != 'string' && !userInfo.picture.length) throw new Error('picture not present');
        if(typeof userInfo.profile != 'string' && !userInfo.profile.length) throw new Error('profile not present');
        if(typeof userInfo.nameid != 'string' && !userInfo.nameid.length) throw new Error('nameid not present');
        return userInfo;
    }


    //================================================================
    /**
     * Returns the session auth object
     * @param {object} tokenSet
     * @param {object} userInfo
     * @returns {(object)}
     */
    async getUserSession(tokenSet, userInfo){
        let auth = {
            provider: 'citizenfx',
            provider_uid: userInfo.name,
            expires_at: tokenSet.expires_at,
            picture: userInfo.picture
        }
        return auth;
    }

} //Fim CitizenFXProvider()
