const modulename = 'DynamicAds';
import defaultAds from '../../dynamicAds2.json';
import got from '@core/extras/got.js';
import consoleFactory from '@extras/console';
import { convars } from '@core/globalData';
const console = consoleFactory(modulename);

//Helpers
const isValidAd = (ad) => {
    if (typeof ad !== 'object' || ad === null) return false;
    if (typeof ad.img !== 'string') return false;
    if (typeof ad.url !== 'string') return false;
    return true;
};
const REMOTE_AD_INDEX = 'https://raw.githubusercontent.com/tabarra/txAdmin/master/dynamicAds2.json';

export default class DynamicAds {
    constructor() {
        this.adData = {
            login: false,
            main: false,
        };

        //Set default ads
        try {
            if (convars.isZapHosting) {
                this.adData = {
                    login: isValidAd(defaultAds.loginZap) && defaultAds.loginZap,
                    main: isValidAd(defaultAds.mainZap) && defaultAds.mainZap,
                };
            } else {
                this.adData = {
                    login: isValidAd(defaultAds.login) && defaultAds.login,
                    main: isValidAd(defaultAds.main) && defaultAds.main,
                };
            }
        } catch (error) {
            console.verbose.warn(`Failed to read default dynamic ads with error: ${error.message}`);
        }

        //Update with the ads from the interweebs
        this.update();
    }


    /**
     * Updates the ads from the interweebs
     */
    async update() {
        try {
            const res = await got(REMOTE_AD_INDEX).json();
            if (convars.isZapHosting) {
                this.adData = {
                    login: isValidAd(res.loginZap) && res.loginZap,
                    main: isValidAd(res.mainZap) && res.mainZap,
                };
            } else {
                this.adData = {
                    login: isValidAd(res.login) && res.login,
                    main: isValidAd(res.main) && res.main,
                };
            }
        } catch (error) {
            console.verbose.warn(`Failed to retrieve dynamic ads with error: ${error.message}`);
        }
    }
};
