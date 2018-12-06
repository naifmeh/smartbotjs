
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
                y: dataRewards.rewards,
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
(() => {
   const plotting = new Plotting();
   plotting.plot_rewards({x: [1,2,3,4,5,6,7,8,9,10],
                        rewards: [1200,1542,857,658,684,574,1025,256,896]})
})();
