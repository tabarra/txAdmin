//Requires
const modulename = 'DynamicAds';
const xss = require('xss');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);
const got = require('../extras/got');
const defaultAds = require('../../dynamicAds.json');

//Helper
const cleanAds = (ads) => {
    return ads.map((ad) => {
        if (ad.text) ad.text = xss(ad.text);
        return ad;
    });
};


module.exports = class DynamicAds {
    constructor() {
        this.adIndex = {
            login: 0,
            main: 0,
        };
        this.adOptions = false;

        //Set default ads
        if (Array.isArray(defaultAds.login) && Array.isArray(defaultAds.main)) {
            this.adOptions = {
                login: cleanAds(defaultAds.login),
                main: cleanAds(defaultAds.main),
            };
        }

        //Update with the ads from the interweebs
        this.update();

        //Cron Function
        setInterval(() => {
            this.rotate();
        }, 60 * 1000);
    }


    //================================================================
    async update() {
        const indexURL = 'https://raw.githubusercontent.com/tabarra/txAdmin/master/dynamicAds.json';
        try {
            const res = await got(indexURL).json();
            if (Array.isArray(defaultAds.login) && Array.isArray(defaultAds.main)) {
                this.adOptions = {
                    login: cleanAds(res.login),
                    main: cleanAds(res.main),
                };
                this.adIndex = {
                    login: 0,
                    main: 0,
                };
            }
        } catch (error) {
            if (GlobalData.verbose) logWarn(`Failed to retrieve dynamic ads with error: ${error.message}`);
        }
    }


    //================================================================
    rotate() {
        if (!this.adOptions) return;
        this.adIndex.login = (this.adIndex.login + 1) % this.adOptions.login.length;
        this.adIndex.main = (this.adIndex.main + 1) % this.adOptions.main.length;
    }


    //================================================================
    pick(spot) {
        if (!this.adOptions) {
            return false;
        } else if (spot === 'login') {
            return (this.adOptions.login && this.adOptions.login.length)
                ? this.adOptions.login[this.adIndex.login]
                : false;
        } else if (spot === 'main') {
            return (this.adOptions.main && this.adOptions.main.length)
                ? this.adOptions.main[this.adIndex.main]
                : false;
        } else {
            throw new Error('unknown spot type');
        }
    }
}; //Fim DynamicAds()
