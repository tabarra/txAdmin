**DO NOT** Modify `css/coreui.css`. Either do a patch in the `custom.css` or modify the SCSS variables.  
This doc is a reference if you are trying to re-build the `css/coreui.css` from the SCSS source.  
The only thing I changed from CoreUI was the `aside-menu` size from 200px to 300px in `scss/_variables.scss : $aside-menu-width`.  
  
```bash
$ git clone https://github.com/coreui/coreui-free-bootstrap-admin-template.git coreui
$ cd coreui

# If you want to make sure you used the same version of CoreUI
$ git checkout ce9cc5a09fe02aedbe025ab6a8b15af975ade7f6

# Edit your stuff and then to compile:
$ npx node-sass --output-style expanded --source-map true --source-map-contents true --precision 6 scss/coreui.scss dist/css/coreui.css
```
  
Then copy the `dist/css/coreui.css` to txAdmin's folder.  
  
----
  
**Note:** When it comes to interface, I have no clue what I'm doing, so this is probably not right.  
*-- Tabarra*