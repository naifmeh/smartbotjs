

function Algorithm_Utils() {

    function generate_step_array(max, step) {
        let step_arr = []
        for(let i=0; i<max; i+=step) {
            step_arr.push([i, i+step])
        }

        return step_arr
    }

    function reformat_proxies(proxies) {
        const dbly_lkd = require('dbly-linked-list');
        let list = new dbly_lkd();
        proxies.forEach(function(value, _) {
            let proxy = '';
            if(value['HTTPS'] === 'yes')
                proxy = 'https://';
            else
                proxy = 'http://';
            proxy += value['IP']+':'+value['PORT'];

            list.insert({proxy: proxy, usage:0});
        });

        return list;
    }

    function reformat_useragents(useragents) {
        const dbly_lkd = require('dbly-linked-list');
        let list = new dbly_lkd();

        for(let i=0; i< useragents.length; i++) {
            list.insert({useragent:value, usage:0});
        }

        return list;
    }

    function serialise_program(properties) {

    }

    return {
        generate_step_array: generate_step_array,
        reformat_proxies: reformat_proxies,
        reformat_useragents: reformat_useragents,
    }
}

module.exports.algo_utils = new Algorithm_Utils();

