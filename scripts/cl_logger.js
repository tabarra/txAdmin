//Helpers
const log = (x)=>{console.log(x)}
const dir = (x)=>{console.dir(x)}
const logError = (err) => {
    console.log(`====> Error: ${err.message}`);
    console.log(err.stack)
}
const chat = (data) => {
    emit('chat:addMessage', {
        color: [255, 0, 0],
        multiline: true,
        args: ["Console", data]
    })
}


//Death Reasons
let hashTable = {
    animal: [-100946242, 148160082],
    bullet: [453432689, 1593441988, 584646201, -1716589765, 324215364, 736523883, -270015777, -1074790547, -2084633992, -1357824103, -1660422300, 2144741730, 487013001, 2017895192, -494615257, -1654528753, 100416529, 205991906, 1119849093],
    burn: [615608432, 883325847, -544306709],
    car: [133987706, -1553120962],
    drown: [-10959621, 1936677264],
    explosion: [-1568386805, 1305664598, -1312131151, 375527679, 324506233, 1752584910, -1813897027, 741814745, -37975472, 539292904, 341774354, -1090665087],
    gas: [-1600701090],
    knife: [-1716189206, 1223143800, -1955384325, -1833087301, 910830060],
    melee: [-1569615261, 1737195953, 1317494643, -1786099057, 1141786504, -2067956739, -868994466],
    unknown: [-842959696], //Fall Damage or SetEntityHealth()
}


//Process player death
function processDeath(ped){
    let killerPed = GetPedSourceOfDeath(ped);

    let killer = null;
    let deathReason = null;
    if(killerPed == ped){
        killer = false;
        deathReason = 'suicide';
    }else{
        if(IsEntityAPed(killerPed) && IsPedAPlayer(killerPed)){
            killer = NetworkGetPlayerIndexFromPed(killerPed);
        }else if(IsEntityAVehicle(killerPed) && IsEntityAPed(GetPedInVehicleSeat(killerPed, -1)) && IsPedAPlayer(GetPedInVehicleSeat(killerPed, -1))){
            killer = NetworkGetPlayerIndexFromPed(GetPedInVehicleSeat(killerPed, -1));
        }

        let DeathCauseHash = GetPedCauseOfDeath(ped)
        deathReason = Object.keys(hashTable).find((reason)=>{
            return hashTable[reason].includes(DeathCauseHash);
        });
    }

    emitNet('txaLogger:DeathNotice', killer, deathReason);
}

//Detect death
let deathFlag = false;
setInterval(() => {
    let ped = PlayerPedId()
    let isDead = IsEntityDead(ped);
    if(isDead && !deathFlag){
        deathFlag = true;
        processDeath(ped);
    }
    if(!isDead){
        deathFlag = false;
    }
}, 750);
