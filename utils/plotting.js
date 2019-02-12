
function Plotting() {
    const plotly = require('plotly')('naifmeh', 'K4MZCDD8mJDKWkm0u1V8');

    function avg (v) {
        return v.reduce((a,b) => a+b, 0)/v.length;
    }

    

    function plot_rewards(dataRewards, smoothing_window=0, title='None') {
        const smooth = require('array-smooth');
        let data = [
            {   x: dataRewards.x,
                y: smoothing_window == 0 ? dataRewards.rewards : smooth(dataRewards.rewards, smoothing_window),
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


//    module.exports = new Plotting();
//     (() => {
//        let vals = JSON.parse('{"0":100,"1":100,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":44.44444444444444,"15":0,"16":4.3478260869565215,"17":0,"18":0.9900990099009901,"19":0,"20":1.5873015873015872,"21":0,"22":0,"23":91.78082191780823,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":10.588235294117647,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":1.9801980198019802,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0.9900990099009901,"51":3.9603960396039604,"52":0,"53":0,"54":0,"55":8,"56":0,"57":0,"58":0,"59":0,"60":0,"61":0,"62":0,"63":0,"64":3.9603960396039604,"65":0,"66":0,"67":0,"68":0,"69":21.666666666666668,"70":0,"71":0,"72":0,"73":0,"74":0,"75":0,"76":0,"77":0,"78":0,"79":100,"80":0.9900990099009901,"81":0,"82":0,"83":0.9900990099009901,"84":7.142857142857142,"85":3.9603960396039604,"86":0,"87":1.9607843137254901,"88":0,"89":0,"90":0,"91":0,"92":0,"93":0,"94":1.9801980198019802,"95":0,"96":0,"97":0,"98":100,"99":0,"100":1.3888888888888888,"101":0,"102":5.128205128205128,"103":0,"104":0,"105":0,"106":0,"107":0,"108":94.11764705882352,"109":0,"110":0,"111":0,"112":0,"113":0,"114":0,"115":1.694915254237288,"116":0,"117":0,"118":0,"119":0,"120":0,"121":0,"122":5.797101449275362,"123":0,"124":1.9801980198019802,"125":0,"126":0,"127":0,"128":0,"129":0,"130":6.666666666666667,"131":0,"132":0,"133":50,"134":0,"135":0,"136":0,"137":0,"138":0,"139":0,"140":0,"141":0,"142":0,"143":0,"144":0,"145":2.857142857142857,"146":2.9702970297029703,"147":0,"148":0,"149":0,"150":0.9900990099009901,"151":0,"152":0,"153":0.9900990099009901,"154":0,"155":0,"156":0,"157":2,"158":0,"159":0,"160":0,"161":0,"162":0.9900990099009901,"163":0,"164":6.666666666666667,"165":0,"166":0,"167":0,"168":0,"169":100,"170":0,"171":10.891089108910892,"172":1.1111111111111112,"173":0,"174":0,"175":0,"176":0,"177":0,"178":0,"179":0,"180":0,"181":0,"182":0,"183":0,"184":0,"185":2.9702970297029703,"186":0,"187":22.22222222222222,"188":0,"189":0,"190":0,"191":7.920792079207921,"192":0,"193":0,"194":0,"195":0,"196":0,"197":0,"198":0,"199":0,"200":0,"201":0,"202":0,"203":0,"204":100,"205":0,"206":0,"207":0,"208":0.9900990099009901,"209":0,"210":1.9801980198019802,"211":0,"212":0,"213":0.9900990099009901,"214":0,"215":0.9900990099009901,"216":0,"217":0,"218":0,"219":18.0327868852459,"220":0,"221":0,"222":0,"223":0,"224":0,"225":2.127659574468085,"226":1.0638297872340425,"227":0,"228":9.090909090909092,"229":0,"230":10,"231":26.732673267326735,"232":3.6585365853658534,"233":0,"234":0,"235":5,"236":0,"237":2.9702970297029703,"238":0,"239":88.37209302325581,"240":1.0526315789473684,"241":0,"242":0,"243":0,"244":0,"245":0,"246":3.9603960396039604,"247":100,"248":0,"249":0,"250":0,"251":0,"252":0,"253":0,"254":0,"255":0.9900990099009901,"256":4.9504950495049505,"257":0,"258":0.9900990099009901,"259":5.405405405405405,"260":0,"261":100,"262":0,"263":0,"264":0,"265":0,"266":0,"267":2.083333333333333,"268":0,"269":100,"270":2.272727272727273,"271":3.125,"272":0,"273":5.88235294117647,"274":0,"275":50,"276":0,"277":0,"278":0,"279":0.9900990099009901,"280":0.9900990099009901,"281":0,"282":0.9900990099009901,"283":0,"284":0,"285":0,"286":0,"287":0,"288":0,"289":0.9900990099009901,"290":3.9603960396039604,"291":2.7777777777777777,"292":0.9900990099009901,"293":0,"294":9.433962264150944,"295":0,"296":0,"297":0,"298":0,"299":0,"300":0,"301":99.00990099009901,"302":0,"303":0,"304":2.127659574468085,"305":0,"306":0,"307":0,"308":9.230769230769232,"309":0,"310":0,"311":0,"312":20,"313":0,"314":0,"315":0,"316":0,"317":50,"318":0,"319":0.9900990099009901,"320":0,"321":3.9603960396039604,"322":0,"323":0,"324":0,"325":0.9900990099009901,"326":0,"327":0,"328":0.9900990099009901,"329":7.291666666666667,"330":0.9900990099009901,"331":2.1052631578947367,"332":0,"333":1.9801980198019802,"334":100,"335":0,"336":0,"337":0,"338":0,"339":0,"340":100,"341":0,"342":1.6666666666666667,"343":0,"344":0,"345":0,"346":0.9900990099009901,"347":0,"348":0,"349":3.9603960396039604,"350":0,"351":0,"352":0,"353":0,"354":0,"355":0,"356":0,"357":0,"358":50,"359":0,"360":0,"361":0,"362":0,"363":0,"364":0,"365":17.647058823529413,"366":0,"367":0,"368":0,"369":0,"370":0,"371":0,"372":50,"373":4.166666666666666,"374":0,"375":0,"376":9.090909090909092,"377":0,"378":0,"379":1.2658227848101267,"380":0,"381":0,"382":0.9900990099009901,"383":1.0204081632653061,"384":0.9900990099009901,"385":0,"386":0,"387":0,"388":4.9504950495049505,"389":1.098901098901099,"390":0,"391":100,"392":0,"393":0,"394":0,"395":2.9702970297029703,"396":0,"397":0,"398":0,"399":0,"400":0,"401":0,"402":5.9405940594059405,"403":0,"404":15.841584158415841,"405":0,"406":0,"407":0,"408":0,"409":0.9900990099009901,"410":22.772277227722775,"411":0,"412":0,"413":0,"414":0,"415":0,"416":0,"417":0,"418":33.33333333333333,"419":3.4482758620689653,"420":0,"421":0,"422":6.25,"423":0,"424":100,"425":1.9801980198019802,"426":0,"427":0.9900990099009901,"428":0,"429":0,"430":0.9900990099009901,"431":0.9900990099009901}');
//         new Plotting().plot_rewards({
//             x: Object.keys(vals),
//             rewards: Object.values(vals),
//         },15, 'Pourcentage de bloquage par episode Sarsa (v5)');
//         new Plotting().plot_bars({
//             x: Object.keys(vals),
//            rewards: Object.values(vals),
//        }, 'Bar plot sarsa with remote agent Sarsa (v5)')
//    })();


//    module.exports = new Plotting();
//     (() => {
//        let vals = JSON.parse('{"0":100,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":22.22222222222222,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":2.73972602739726,"24":0,"25":0,"26":0,"27":0}');
//         new Plotting().plot_rewards({
//             x: Object.keys(vals),
//             rewards: Object.values(vals),
//         },10, 'Pourcentage de bloquage par episode Actor-Critic');
//         new Plotting().plot_bars({
//             x: Object.keys(vals),
//            rewards: Object.values(vals),
//        }, 'Bar plot sarsa with remote agent Actor-Critic')
//    })();
//   module.exports = new Plotting();
//    (() => {
//       let vals = JSON.parse('{"0":100,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":11.11111111111111,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":1.36986301369863,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0,"51":0,"52":0,"53":0,"54":0,"55":0,"56":0,"57":0,"58":0,"59":0,"60":0,"61":0,"62":0,"63":0,"64":0,"65":0,"66":0,"67":0,"68":3.3333333333333335,"69":0,"70":0,"71":0,"72":0,"73":0,"74":0,"75":0,"76":0,"77":0,"78":0,"79":0}');
//        new Plotting().plot_rewards({
//            x: Object.keys(vals),
//            rewards: Object.values(vals),
//        },10, 'Pourcentage de bloquage par episode QLearning');
//        new Plotting().plot_bars({
//            x: Object.keys(vals),
//           rewards: Object.values(vals),
//       }, 'Bar plot sarsa with remote agent Qlearning')
//   })();

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
