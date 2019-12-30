let monitormode = GetConvar("monitormode", "false")
if(monitormode == "true"){
    require('./src/index.js')
}else{
    console.log(">is server")
}
