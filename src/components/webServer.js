//Requires
const express = require('express');
const Sqrl = require("squirrelly");
const { log, logOk, logWarn, logError } = require('../extras/conLog');


module.exports = class WebServer {
    constructor(config) {
        this.config = config;
        this.context = 'WebServer';
        this.app = express()
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(express.static('public'))
        this.setupRoutes()
        this.app.listen(this.config.port, () => {
            logOk(`::WebServer Iniciado na porta ${this.config.port}!`);
        })
    }

    
    //================================================================
    //FIXME: ffs put this shit in another file 
    async setupRoutes(){
        
        this.app.post('/action', async (req, res) => {
            // log(req.body);
            if(
                typeof req.body.action == undefined ||
                typeof req.body.parameter == undefined ||
                typeof req.body.password == undefined
            ){
                logError(error);
                res.send('Invalid data!');
            }
            if (this.config.password !== false && req.body.password != this.config.password) {
                sendOutput(res, 'Wrong password!');
                return;
            }


            let action = req.body.action;
            let parameter = req.body.parameter;

            if(action == 'admin_say'){
                globals.fxServer.srvCmd('say ' + parameter);
                return sendOutput(res, 'Okay');

            }else if(action == 'restart_res'){
                let toResp = await globals.fxServer.srvCmdBuffer('restart ' + parameter);
                return sendOutput(res, toResp);

            }else if(action == 'start_res'){
                globals.fxServer.srvCmd('start ' + parameter);
                return sendOutput(res, 'tmp');

            }else if(action == 'stop_res'){
                globals.fxServer.srvCmd('stop ' + parameter);
                return sendOutput(res, 'tmp');

            }else if(action == 'refresh_res'){
                globals.fxServer.srvCmd('refresh');
                return sendOutput(res, 'tmp');

            }else if(action == 'restart_sv'){
                await globals.fxServer.restartServer();
                return sendOutput(res, 'Done');

            }else if(action == 'stop_sv'){
                globals.fxServer.killServer();
                return sendOutput(res, 'Done');

            }else if(action == 'start_sv'){
                globals.fxServer.spawnServer();
                return sendOutput(res, 'Done');

            }else{
                return sendOutput(res, 'Unknown action!');
            }
        })

        this.app.get('*', function(req, res){
            res.redirect('/');
        });


        
    }

} //Fim WebServer()



function sendOutput(res, msg){
    let html = Sqrl.renderFile('public/out.html', {msg: msg});
    return res.send(html);
}