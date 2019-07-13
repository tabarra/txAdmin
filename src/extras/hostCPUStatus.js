//Requires
var os = require('os');


module.exports = class HostCPUStatus {
    constructor() {
        this.samples = [];
        this.prevCpus = os.cpus();
        this.data;

        setInterval(() => {
            this.getSamples();
        }, 100);
    }


    //================================================================
    /**
     * Returns an object containing host's machine cpu usage
     * @returns {object} {full, last10, last30}
     */
    getUsageStats(){
        var result = {full:null, last10:null, last30:null}
        var percent = 0
        var i = this.samples.length
        var cnt = 0
        while (i--) {
            cnt++;
            if (this.samples[i].total > 0){
                percent += (100 - Math.round(100 * this.samples[i].idle / this.samples[i].total))
            }
            if (cnt == 100)       result.last10  = (percent/cnt).toFixed();   //10 segundos
            else if (cnt == 300)  result.last30  = (percent/cnt).toFixed();  //30 segundos
        }

        result.full = (cnt)? (percent/cnt).toFixed() : null;
        return result;
    }


    //================================================================
    /**
     * Get samples and process deltas
     */
    getSamples(){
        let currCpus = os.cpus()
        for (var i=0,len=currCpus.length;i<len;i++) {
            var prevCpu = this.prevCpus[i];
            var currCpu = currCpus[i];
            var deltas = {total:0};
            for (var t in prevCpu.times)
                deltas.total += currCpu.times[t] - prevCpu.times[t];
            for (var t in prevCpu.times)
                deltas[t] = currCpu.times[t] - prevCpu.times[t];
        }
        this.prevCpus = currCpus;
        this.samples.push(deltas);
        if (this.samples.length>300) this.samples.shift();
    }


} //Fim HostCPUStatus()
