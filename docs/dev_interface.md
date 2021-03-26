## Interface Development
**DO NOT** Modify `css/coreui.css`. Either do a patch in the `custom.css` or modify the SCSS variables.  
This doc is a reference if you are trying to re-build the `css/coreui.css` from the SCSS source.  
The only thing I changed from CoreUI was the `aside-menu` size from 200px to 300px in `scss/_variables.scss : $aside-menu-width`.  
You can find the other variable names in `node_modules/@coreui/coreui/scss/coreui`.  
  
```bash
$ git clone https://github.com/coreui/coreui-free-bootstrap-admin-template.git coreui
$ cd coreui
$ npm i

# If you want to make sure you used the same version of CoreUI
$ git checkout 0cb1d81a8471ff4b6eb80c41b45c61a8e2ab3ef6

# Edit your stuff and then to compile:
$ npx node-sass --output-style expanded --source-map true --source-map-contents true --precision 6 src/scss/style.scss src/css/style.css
```
  
Then copy the `src/css/style.css` to txAdmin's folder.  
  
----
  
**Note:** When it comes to interface, I have no clue what I'm doing, so this is probably not right.  
*-- Tabarra*
