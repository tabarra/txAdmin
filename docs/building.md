## Installing & Building it (Windows/Linux)
  
**Attention: NOT RECOMMENDED for most users.**  
Actually I moved this to a separate file just so people stop copying the commands without reading that you don't need to do this anymore.

```bash
#Inside your FXServer folder, execute:
cd citizen/system_resources
mv monitor monitorOld
git clone -b conversion https://github.com/tabarra/txAdmin monitor
cd monitor
npm i

#To perform an build execute the following then check the `dist` folder.
npm run build
```
