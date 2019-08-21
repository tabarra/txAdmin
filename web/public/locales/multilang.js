/*
 * Author: maxkalb.github.io
 *
 * This script automizes/wraps the registration of translations for R.js.
 * To do so it simply loads predefined translation js files to the head.
 * In addition it provides an automization for plain text translations and
 * some helper functions to easy up language selection by automatically 
 * adding html options according to the number of languages registered.
 * Users language selection will be stored in local storrage and
 * autoreload languange from local storrage is provided.
 * 
 * Uscase: Separate and easy up the translation process for R.js.
 *
 * 1. Define translation js file-names to be loaded.
 * 2. Set the directory of the translation files.
 * 3. Define select id for easy language switching* (optional).
 *
 * Note: langdef.js file must be inside langdirectory!
 *     * Select options will be auto populated with 'langdef.js' names.
 *     Make sure to add ...  
 */
 
// >-- Translations to be loaded .. 
var langfiles = ['en', 'cs'];

// >-- Initial setup ..
var langdirectory = 'locales/';           // The translation files directory
var defaultlang = 'en';           // Initial language if local storrage is not set
var asfEnable = true;                // Set true to use R.js advanced string formating (asf)
var loadCustomjs = asfEnable;        // Set false to manually load 'custom.js' later instead of now.
var langSelectId = 'selectLanguage'; // Select element id to be used for language switching

/*
 * Dummy function for  advanced string formating (asfEnable == true).
 * Note: Overwrite this within the 'custom.js' for advanced translation control.
 */
function translateCustomTexts() { }

/*
 * Creates a script element with src 'filename' and appends it to the head. 
 */
function loadjsfile( filename ) {
  var fileref = document.createElement('script');
  fileref.setAttribute("type", "text/javascript");
  fileref.setAttribute("src", filename);
  document.getElementsByTagName("head")[0].appendChild(fileref);
}

/*
 * Load js langauge definitions and register R.js translations.
 */
loadjsfile( langdirectory + 'langdef.js' );
for( var file of langfiles ) { 
  loadjsfile( langdirectory + file + '.js' ); 
}

/*
 * Load custom langauge definitions and register R.js translations.
 */
if( asfEnable && loadCustomjs ) loadjsfile( langdirectory + 'custom.js' );

/*
 * Set 'defaultlang' from local storage (if existing). 
 */
function getLocalLanguage() {
  if( localStorage.getItem('lang') != null )
    defaultlang = localStorage.getItem('lang');
}

/* 
 * Autopopulates select 'langSelectId' options with defined languages 'langfiles'.
 * 
 * Appends one select options for each defined language. The options id, value
 * and text will be set according to the 'langfiles' names. Therefore underscores
 * in the file names are substituted by minus signs.
 */
function initLanguageOptions() {
  var select = document.getElementById( langSelectId );
  if( select != null ) {
    var cnt = 0;
    for( var language of langfiles ) {
      option = document.createElement('option');
      option.value = option.text = option.id = language.replace('_','-');
      select.add(option);
      cnt++;
    }
    
    if( cnt == 0 ) console.log('warning: no translation defined');
    
    R.setLocale('langs');
    for( var language of langfiles ) {
      language = language.replace('_', '-');
      document.getElementById(language).innerHTML = R(language);
    }
  }
}

/* 
 * Sets the selected index of the language selection corresponding to 'defaultlang'. 
 */
function setSelectOption() {
  var select = document.getElementById( langSelectId );  
  if( select != null && select.options[select.selectedIndex].value != defaultlang ) {
    for( var i=0; i<select.length; i++ ) {
      if( select.options[i].value == defaultlang ) {
        select.selectedIndex = i;
        break;
      }
    }
  }
}

/* 
 * Callback function if user changes the language from the 'langSelectId' element.
 *
 * Make sure to add 'onchange="selectedLanguageChanged();"' to the 'langSelectId' element. 
 * Saves the user selection to the local storage and updates the viewed language.
 */
function selectedLanguageChanged() {
  var select = document.getElementById( langSelectId );
  if( select != null ) {
    defaultlang = select.options[select.selectedIndex].value;
    localStorage.setItem('lang', defaultlang);
    updateLanguage();
  }
}

/*
 * Validates a string by the following criteria:
 * - The string must not be empty (emty strings are invalid).
 * - The string does not contain '%i' and '%s' char sequences.
 */
function isStringValid(str) {
  var valid = false; 
  if( Boolean(str) && str.indexOf('%i') === -1 && str.indexOf('%s') === -1 ) {
    valid = true;
  }
  return valid;
}

/*
 * Updates the inner HTML of the given 'elementId' with the given 'text'.
 *
 * Constrains are: Must have a valid 'elementId' and a valid 'text'. For the
 * text this means it must pass isStringValid() and must not be equal to the 
 * 'elementId'. Furthermore the class 'multilang' must be assigned.
 */
function updateTranslation(elementId, text) {
  var matchClass = "multilang";
  var elem = document.getElementById( elementId );
  if( elem != null ) {
    if( !isStringValid(text) ) {
      console.log('invalid text: ' + text);
      return;
    }
    if( text === elem.id ) {
      console.log('missing translation for element id: ' + text);
      return;
    }
    if( (' ' + elem.className + ' ').indexOf(' ' + matchClass + ' ') > -1 ) {
      elem.innerHTML = text;
      if( elem.type == "submit" ) elem.value = text;
    }
    else console.log('missing class ' + matchClass + ' for element id: ' + elem.id);
  }
}

/*
 * Helper function to call R.js advanced string translation with a single parameter.
 * The inserted parameter type must match integer (%i) or string (%s) as registered.
 */
function updateTranslationParameter(elementId, param) {
  updateTranslation(elementId, R(elementId, param));
}

/* 
 * Translate all plain text 'multilang' class elements.
 *
 * Selects all 'multilang' class elements in the dom and trys to translate
 * their contents by using the element ids for R.js translation calls. This
 * function translates plain text translations only! Translations containing
 * parameters like %i are skipped. These need to be translated manually! See
 * custom.js for more details on how to use R.js' advanced formating ability.
 *
 * Uscase: Automize/wrap translation update of 'multilang' class elements. 
 */
function translatePlainTexts() {
  var matchClass = "multilang";
  var elems = document.getElementsByTagName('*');
  for( var i=0; elems[i]; i++ ) {
    if((' ' + elems[i].className + ' ').indexOf(' ' + matchClass + ' ') > -1) {
      var text = R( elems[i].id );
      if( isStringValid(text) ) {
        updateTranslation(elems[i].id, text);
      }
      else if( !asfEnable ) { 
        console.log("invalid string '" + text + "' " + " for element id: " + elems[i].id);
        console.log("Is asf enabled? 'custom.js' loaded and are all asf strings overwritten?");
      }
    }
  }
}

/* 
 * Updates the viewed language by using state of global 'defaultlang' 
 */
function updateLanguage(){
  R.setLocale( defaultlang );
  setSelectOption();
  translatePlainTexts();
  if( asfEnable == true ) { 
    translateCustomTexts();
  }
}

/*
 * Call this on page load to perfom initialization and initial translation.
 */
function initLanguages() {
  initLanguageOptions();
  getLocalLanguage();
  updateLanguage();
}

