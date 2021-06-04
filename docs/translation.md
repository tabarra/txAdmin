## Translation Support
txAdmin supports translation  in over 25 languages for the in-game interface (menu/warn) and chat messages, as well as discord warnings.  

  
### Custom locales:
If your language is not available, or you want to customize the messages, create a `locale.json` file in inside the `txData` folder based on any language file found on [our repository](https://github.com/tabarra/txAdmin/tree/master/locale). Then go to the settings and select the "Custom" language option.  
  
The `$meta.humanizer_language` must be compatible with the library [humanize-duration](https://www.npmjs.com/package/humanize-duration), check their page for a list of compatible languages.


### Contributing:
We need the community help to translate, and keep the translations updated and high-quelity.  
For that you will need to:
- Make a custom locale file with the instructions above;
- Name the file using the language code in [this page](https://www.science.co.il/language/Locale-codes.php);
- The `$meta.label` must be the language name in English (eg `Spanish` instead of `Español`);
- Execute `npm run locale:diff` to make sure your translation has no extra or missing keys;
- Do a [Pull Request](https://github.com/tabarra/txAdmin/pulls) posting screenshots of evidence that you tested what you changed.

**We appreciate it a lot :)**
