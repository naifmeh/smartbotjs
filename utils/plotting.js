
function Plotting() {
    const plotly = require('plotly')('naifmeh', 'K4MZCDD8mJDKWkm0u1V8');

    function avg (v) {
        return v.reduce((a,b) => a+b, 0)/v.length;
    }

    function smoothOut (vector, variance) {
        var t_avg = avg(vector)*variance;
        var ret = Array(vector.length);
        for (var i = 0; i < vector.length; i++) {
            (function () {
                var prev = i>0 ? ret[i-1] : vector[i];
                var next = i<vector.length ? vector[i] : vector[i-1];
                ret[i] = avg([t_avg, avg([prev, vector[i], next])]);
            })();
        }
        return ret;
    }

    function plot_rewards(dataRewards, smoothing_window=10, title='None') {
        let data = [
            {   x: dataRewards.x,
                y: smoothOut(dataRewards.rewards,0.75),
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

    return {
        plot_rewards: plot_rewards,
    }
}

module.exports = new Plotting();
// (() => {
//     let vals = JSON.parse('{"0":100,"1":100,"2":100,"3":100,"4":26.666666666666668,"5":28.57142857142857,"6":93.06930693069307,"7":91.0891089108911,"8":0,"9":1.9801980198019802,"10":0,"11":8.695652173913043,"12":66.66666666666666,"13":77.77777777777779,"14":0,"15":43.47826086956522,"16":0,"17":21.782178217821784,"18":10,"19":79.36507936507937,"20":0,"21":82.35294117647058,"22":16.43835616438356,"23":0,"24":25,"25":0.9900990099009901,"26":23.076923076923077,"27":9.900990099009901,"28":64.70588235294117,"29":0,"30":24.752475247524753,"31":18.81188118811881,"32":4.597701149425287,"33":25}');
//     new Plotting().plot_rewards({
//         x: Object.keys(vals),
//         rewards: Object.values(vals),
//     },10, 'Pourcentage de bloquage par épisode');
// })();
