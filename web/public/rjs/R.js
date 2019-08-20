/*jslint white: false, browser: true, devel: true, onevar: true, undef: true,
 nomen: true, eqeqeq: true, plusplus: false, bitwise: true, regexp: true,
 newcap: true, immed: true, maxlen: 100, indent: 4 */
/*globals module: false*/
/*
 * R.js - Internationalisation Library
 *
 * R.js is a simple Javascript Internationalisation library
 *
 * This code is licensed under the MIT
 * For more details, see http://www.opensource.org/licenses/mit-license.php
 * For more information, see http://github.com/keithcirkel/R.js
 *
 * @author Keith Cirkel ('keithamus') <rdotjs@keithcirkel.co.uk>
 * @license http://www.opensource.org/licenses/mit-license.php
 * @copyright Copyright © 2011, Keith Cirkel
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
(function (exports) {
    var oldR = exports.R
    ,   inited = false
    ,   eR
    ,   undef
    ,   R = {
        
        init: function (lang) {
            lang = lang || typeof navigator !== undef ? navigator.language : 'en-GB';
            //Initialise some variables.
            eR.locales = {};
            eR.navLang = lang;
            inited = true;
        },
        
        slice: function (a) {
            return Array.prototype.slice.call(a);
        },
        
        AinOf: function (a, v) {
            for (var i = 0, c = a.length; i < c; ++i) if (a[i] === v) return i;
            return -1;
        },
        
        realTypeOf: function (v) {
            return Object.prototype.toString.call(v).match(/\w+/g)[1].toLowerCase();
        },
    
        render: function (id, args) {
            if (eR.locales && eR.locales.hasOwnProperty(eR.lang)) {
                if (eR.locales[eR.lang].hasOwnProperty(id)) {
                    id = eR.locales[eR.lang][id];
                }
            }
            
            // If we've no arguments, let's return
            if (!args || args.length === 0) {
                return id;
            }
    
            // Ok, we do have args, so lets parse them.
            args = R.parseVariables(args);
    
            return R.format(id, args);
        },
        
        parseVariables: function (args, ret) {
            var i
            ,   c
            ,   type = R.realTypeOf(args);
    
            // This is our structure for formatting, numbers go in i, string in s,
            // and the named arguments (i.e %(age)) go in named.
            if (!ret) {
                ret = { i: [], s: [], named: {} };
            }
    
            //Check args to see what type it is, and add to ret appropriately.
            switch (type) {
                case 'number': ret.i.push(args);             break;
                case 'string': ret.s.push(args);             break;
                case 'date':   ret.i.push(args.toString());  break;
                case 'object':
                    for (i in args) {
                        if (args.hasOwnProperty(i)) {
                            if (i === 'i' || i === 's') {
                                R.parseVariables(args[i], ret);
                            } else {
                                ret.named[i] = args[i];
                            }
                        }
                    }
                    break;
                case 'array':
                    // Loop through the array, doing what we just did
                    for (i = 0, c = args.length; i < c; ++i) {
                        R.parseVariables(args[i], ret);
                    }
                    break;
            }
    
            return ret;
        },

        format: function (s, a) {
            var i
            ,   replace
            ,   tcount
            ,   substrstart
            ,   type
            ,   l
            ,   types = {i: '%i', s: '%s'}
            ,   tmp = ''
            ,   t;
            
            //First we'll add all integers to the pot, then the strings
            for (type in types) {
                if (types.hasOwnProperty(type)) {
                    tcount = (s.match(new RegExp(types[type], 'g')) || []).length;
                    for (i = 0; i < tcount; ++i) {
                        replace = a[type].hasOwnProperty(i) ? a[type][i] : replace;
                        if (replace !== undef && replace !== false) {
                            if ((substrstart = s.indexOf(types[type])) >= 0) {
                                s = s.substr(0, substrstart) + replace + s.substr(substrstart + 2);
                            }
                        }
                    }
                }
                replace = false;
            }
    
            //Now to loop through the named arguments!
            for (i in a.named) {
                if (a.named.hasOwnProperty(i)) {
                    t = new RegExp("%\\(" + i + "\\)", 'g');
                    s = s.replace(t, a.named[i]);
                }
            }
    
            return s;
        }
    };
    
    /*
     * R
     * Take an `id` from the registered locales and return the string including any variables.
     * @param {String} id The ID of the
     * @param {Mixed} variables
     */
    eR = function (id, variables) {
        // If we haven't initialised our variables etc, then do so.
        if (!inited) R.init();
        
        if (arguments.length > 1) {
            
            // In the case we've been given comma separated arguments, we should
            // load them into an array and send them to render
            var args = R.slice(arguments);
            args.shift();
        
            return R.render(id, args);

        // Otherwise just send the `variables` var.
        } else {
            return R.render(id, [variables]);
        }
    };
    
    /*
     * R.registerLocale
     * Apply `object` of strings to `locale` for use with the main function, R
     * @param {String} locale The locale of the language object, e.g en-US
     * @param {Object} A flat object of strings
     */
    eR.registerLocale = function (locale, object) {
        //If we haven't initialised our variables etc, then do so.
        if (!inited) R.init();
        
        //Throw the object we've been given into locales.
        eR.locales[locale] = object;
        eR.setLocale(eR.navlang);
        return eR;
    };
    
    /*
     * R.localeOrder
     * Change the order of locales, to enable negotiation of a locale with setLocale
     * @param {String} locale The locale that should be set
     */
    eR.localeOrder = function () {
        eR.preferredLocales = R.slice(arguments);
        return eR.setLocale(eR.lang);
    };
        
    /*
     * R
     * Set the `locale` to a different locale
     * @param {String} locale The locale that should be set
     */
    eR.setLocale = function (locale, force) {
        //If we haven't initialised our variables etc, then do so.
        if (!inited) R.init();
        
        if (force) {
            eR.lang = locale;
            return eR;
        }
        var i = 0, key, locales = eR.preferredLocales;
        if (!locales) {
            locales = [];
            for (key in eR.locales) {
                if (eR.locales.hasOwnProperty(key)) locales.push(key);
            }
        }
        if ((key = R.AinOf(locales, locale)) > 0) {
            eR.lang = locales[key];
            return eR;
        }
        eR.lang = locales[0] || locale;
        return eR;
    };
    
    eR.noConflict = function () {
        exports.R = oldR;
        return eR;
    };
    
    exports.R = eR;

}(typeof module !== 'undefined' && module.exports ? module.exports : this));