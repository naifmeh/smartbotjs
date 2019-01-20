
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

module.exports = new Plotting();
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
