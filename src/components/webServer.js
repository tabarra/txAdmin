//Requires
const express = require('express');
const cors = require('cors');
const Sqrl = require("squirrelly");
const xss = require("xss");
const prettyBytes = require('pretty-bytes');
const prettyMs = require('pretty-ms');
const { log, logOk, logWarn, logError } = require('../extras/conLog');


module.exports = class WebServer {
    constructor(config) {
        this.config = config;
        this.context = 'WebServer';
        this.app = express()
        this.app.use(cors());
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
            let adminID = globals.authenticator.checkAuth(req.body.password);
            if(!adminID){
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

        this.app.get('/getHash', function(req, res){
            let pwd = req.query.pwd;
            let hash = globals.authenticator.hash(pwd);
            res.send(`<pre>Password Hash: \n${hash}</pre>`);
        });

        this.app.get('/getData', function(req, res){
            res.send({
                status: sendServerStatus(),
                players: sendPlayers(),
                log: sendLog()
            })
        });


        this.app.get('*', function(req, res){
            res.redirect('/');
        });


        
    }

} //Fim WebServer()


//HACK: take this shit another place
function sendServerStatus(){
    let dataServer = globals.monitor.statusServer; //shorthand much!?
    let dataProcess = globals.monitor.statusProcess; //shorthand much!?

    let out = '<pre>';
    let statusClass = (dataServer.online)? 'text-success bold' : 'text-danger';
    let statusText = (dataServer.online)? 'Online' : 'Offline';
    let ping = (dataServer.online && typeof dataServer.ping !== 'undefined')? dataServer.ping+'ms' : '--';
    let players = (dataServer.online && typeof dataServer.players !== 'undefined')? dataServer.players.length : '--';
    out += `<b>Status:</b> <strong class="${statusClass}">${statusText}</strong>\n`;
    out += `<b>Ping (localhost):</b> ${ping}\n`;
    out += `<b>Players:</b> ${players}\n`;
    out += `<hr>`;

    let cpu = (dataProcess && typeof dataProcess.cpu !== 'undefined')? dataProcess.cpu+'%' : '--' ;
    let memory = (dataProcess && typeof dataProcess.memory !== 'undefined')? prettyBytes(dataProcess.memory) : '--' ;
    let uptime = (dataProcess && typeof dataProcess.uptime !== 'undefined')? prettyMs(dataProcess.uptime) : '--' ;
    let ctime = (dataProcess && typeof dataProcess.ctime !== 'undefined')? dataProcess.ctime+'ms' : '--' ;
    out += `<b>CPU:</b> ${cpu}\n`;
    out += `<b>Memory:</b> ${memory}\n`;
    out += `<b>Uptime:</b> ${uptime}\n`;
    out += `<b>CTime:</b> ${ctime}`;
    out += '</pre>';
    return out;
}

function sendPlayers(){
    let dataServer = globals.monitor.statusServer; //shorthand much!?
    let out = '<pre>';

    out += `<b>Ping\tNick</b>\n`;
    dataServer.players.forEach(player => {
        out += ` ${player.ping}\t`;
        if(player.steam){
            out += `<a href="${player.steam}" target="_blank">${xss(player.name)}</a>\n`;
        }else{
            out += `${player.name}\n`;
        }
    });

    out += '</pre>';
    return out;
}

function sendLog(){
    return ':)';
}

function sendOutput(res, msg){
    let html = Sqrl.renderFile('public/out.html', {msg: msg});
    return res.send(html);
}