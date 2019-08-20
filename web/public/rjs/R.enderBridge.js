/*jslint white: false, browser: true, devel: true, onevar: true, undef: true,
 nomen: true, eqeqeq: true, plusplus: false, bitwise: true, regexp: true,
 newcap: true, immed: true, maxlen: 100, indent: 4 */
/*globals ender: false, R: false, require: false */
/*
 * R.enderBridge.js - Internationalisation Library, bridge to Ender.js
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
(function ($, r) {  
    $.ender({
        R: r('R.js').R
    });

}(ender, require));