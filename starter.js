const monitorMode = GetConvar('monitorMode', 'false');

if(monitorMode == 'true'){
    require('./src/index.js');
}else{
    console.log('>txAdmin in server mode.');
}
