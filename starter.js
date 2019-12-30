let monitormode = GetConvar("monitorMode", "false")
if(monitormode == "true"){
    require('./src/index.js')
}else{
    console.log(">is server")
}
