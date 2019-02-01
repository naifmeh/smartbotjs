
function Plotting() {
    const plotly = require('plotly')('naifmeh', 'K4MZCDD8mJDKWkm0u1V8');

    function avg (v) {
        return v.reduce((a,b) => a+b, 0)/v.length;
    }

    function smoothOut (vector, variance) {
        let t_avg = avg(vector)*variance;
        let ret = Array(vector.length);
        for (let i = 0; i < vector.length; i++) {
            (function () {
                let prev = i>0 ? ret[i-1] : vector[i];
                let next = i<vector.length ? vector[i] : vector[i-1];
                ret[i] = avg([t_avg, avg([prev, vector[i], next])]);
            })();
        }
        return ret;
    }

    function plot_rewards(dataRewards, smoothing_window=5, title='None') {
        const smooth = require('array-smooth');
        let data = [
            {   x: dataRewards.x,
                y: smooth(dataRewards.rewards, smoothing_window),
                name: 'Rewards',
                type: 'scatter'}
        ];
        if(title === 'None') {
            title = "Rewards for each episode"
        }

        let layout = {
            title: title,
            xaxis: {
                title: "Episode",
                titlefont : {
                    family:"Courier New, monospace",
                    size: 18,
                    color: "#7f7f7f"
                }
            },
            yaxis: {
                title: "Reward",
                titlefont : {
                    family:"Courier New, monospace",
                    size: 18,
                    color: "#7f7f7f"
                }
            }

        };

        let graphOptions = {layout: layout, fileopt: 'overwrite', filename:title};

        plotly.plot(data, graphOptions, function(err, msg) {
            console.log(msg);
        })

    }

    function plot_bars(donnes, title="Bar plot") {
        let success_data = [];
        for(let i=0; i< donnes.rewards.length; i++) {
            success_data.push(100 - donnes.rewards[i]);
        }
        let data = {
            x: donnes.x,
            y: donnes.rewards,
            name: "Blocked",
            type: "bar"
        };

        let data2 = {
            x: donnes.x,
            y: success_data,
            name:"Success",
            type: "bar"
        };
        let layout = {
            barmode: "stack",
            title: title,
            xaxis: {
                title: "Episode",
                titlefont : {
                    family:"Courier New, monospace",
                    size: 18,
                    color: "#7f7f7f"
                }
            },
            yaxis: {
                title: "Blocking percentage",
                titlefont : {
                    family:"Courier New, monospace",
                    size: 18,
                    color: "#7f7f7f"
                }
            }

        };

        let final_data = [data, data2]

        let graphOptions = {layout: layout, fileopt: 'overwrite', filename:title};
        plotly.plot(final_data, graphOptions, function(err, msg) {
            console.log(msg);
        })
    }

    return {
        plot_rewards: plot_rewards,
        plot_bars: plot_bars,
    }
}

// module.exports = new Plotting();
//  (() => {
//     let vals = JSON.parse('{"0":100,"1":100,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":300,"15":0,"16":0,"17":0,"18":0,"19":0,"20":100,"21":0,"22":0,"23":300,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":100,"51":200,"52":0,"53":0,"54":0,"55":0,"56":0,"57":0,"58":0,"59":0,"60":0,"61":0,"62":0,"63":0,"64":500,"65":0,"66":0,"67":0,"68":0,"69":100,"70":0,"71":0,"72":0,"73":0,"74":0,"75":0,"76":0,"77":0,"78":0,"79":0,"80":0,"81":0,"82":0,"83":200,"84":100,"85":600,"86":0,"87":0,"88":0,"89":0,"90":0,"91":0,"92":0,"93":0,"94":0,"95":0,"96":0,"97":0,"98":100,"99":0,"100":100,"101":0,"102":200,"103":0,"104":0,"105":0,"106":0,"107":0,"108":1300,"109":0,"110":0,"111":0,"112":0,"113":0,"114":0,"115":0,"116":0,"117":0,"118":0,"119":0,"120":0,"121":0,"122":100,"123":100,"124":500,"125":0,"126":0,"127":0,"128":0,"129":0,"130":0,"131":0,"132":0,"133":100,"134":0,"135":0,"136":0,"137":0,"138":0,"139":0,"140":0,"141":0,"142":0,"143":0,"144":0,"145":100,"146":0,"147":0,"148":0,"149":0,"150":200,"151":0,"152":0,"153":0,"154":0,"155":0,"156":0,"157":0,"158":0,"159":0,"160":0,"161":0,"162":0,"163":0,"164":100,"165":0,"166":0,"167":0,"168":0,"169":100,"170":0,"171":200,"172":100,"173":0,"174":0,"175":0,"176":0,"177":0,"178":0,"179":0,"180":0,"181":0,"182":0,"183":0,"184":100,"185":200,"186":0,"187":0,"188":0,"189":0,"190":0,"191":600,"192":0,"193":0,"194":0,"195":0,"196":200,"197":0,"198":0}');
//      new Plotting().plot_rewards({
//          x: Object.keys(vals),
//          rewards: Object.values(vals),
//      },15, 'Pourcentage de bloquage par episode N_STEP_SARSA');
//      new Plotting().plot_bars({
//          x: Object.keys(vals),
//         rewards: Object.values(vals),
//     }, 'Bar plot sarsa with remote agent N_STEP_SARSA(3)')
// })();
// (() => {
//     let vals = JSON.parse('{"0":100,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":44.44444444444444,"15":0,"16":4.3478260869565215,"17":0,"18":0.9900990099009901,"19":0,"20":1.5873015873015872,"21":0,"22":0,"23":4.10958904109589,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0}');
//     new Plotting().plot_rewards({
//         x: Object.keys(vals),
//         rewards: Object.values(vals),
//     },10, 'Pourcentage de bloquage par episode SARSA (3)');
//
//     new Plotting().plot_bars({
//         x: Object.keys(vals),
//         rewards: Object.values(vals),
//     }, 'Bar plot sarsa with remote agent (3)')
// })();
// (() => {
//     let vals = JSON.parse('{"0":100,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":1.9801980198019802,"8":0,"9":0,"10":0,"11":0,"12":0,"13":22.22222222222222,"14":0,"15":4.3478260869565215,"16":0,"17":0.9900990099009901,"18":0,"19":1.5873015873015872,"20":0,"21":0,"22":5.47945205479452,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":1.1494252873563218,"33":0,"34":0,"35":0}');
//     new Plotting().plot_rewards({
//         x: Object.keys(vals),
//         rewards: Object.values(vals),
//     },10, 'Pourcentage de bloquage par épisode');
//
//     new Plotting().plot_bars({
//         x: Object.keys(vals),
//         rewards: Object.values(vals),
//     }, 'Bar plot sarsa with remote agent')
// })();
