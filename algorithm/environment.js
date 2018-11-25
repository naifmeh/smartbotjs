
function EnvironmentController() {
    const FINGERPRINTING = true;
    const SCREEN_SIZE = true;
    const BLOCK_BOTS = true;
    const MOUSE_PATTERN = false;
    const PLUGINS = true;
    const UA_PROXY = true;
    const UA_COUNT = true;
    const MAX_UA_USE = 1000;
    const MAX_IP_USE = 100;
    const MAX_DOMAIN_COUNT = 100;
    const IP_COUNT = true;
    const DOMAINE_COUNT = true;

    const WEBSITES_DATA_FOLDER = '../preprocessing/data/websites';

    const logger = require('../utils/logging.js').Logger('environment');
    const io_utils = require('../utils/io_utils.js');

    let boolean_states_attributes = {
        fingerprinting: FINGERPRINTING,
        screen_size: SCREEN_SIZE,
        block_bots: BLOCK_BOTS,
        mouse_pattern: MOUSE_PATTERN,
        plugins: PLUGINS,
        ua_proxy: UA_PROXY,
    };

    let numeric_states_attributes = {
        domain_count: DOMAINE_COUNT,
        ua_count: UA_COUNT,
        ip_count: IP_COUNT,
    };

    let states_attributes = {
        fingerprinting: FINGERPRINTING,
        screen_size: SCREEN_SIZE,
        block_bots: BLOCK_BOTS,
        mouse_pattern: MOUSE_PATTERN,
        plugins: PLUGINS,
        ua_proxy: UA_PROXY,
        domain_count: DOMAINE_COUNT,
        ua_count: UA_COUNT,
        ip_count: IP_COUNT,
    };

    let user_agents = io_utils.readLines('./data/useragents.txt');

    /**
     * Function setting up the list of possibles states using cartesian permutations.
     * @returns {Array}
     */
    function set_states() {
        let utils = require('./utils.js').algo_utils;

        let states = [];

        for(let key in boolean_states_attributes) {
            if(boolean_states_attributes[`${key}`] === true) {
                states.push([true, false]);
            }
        }

        for(let key in numeric_states_attributes) {
            if(numeric_states_attributes[`${key}`] === true) {
                let max = 0;
                if(`${key}` === 'ua_count')
                    max = MAX_UA_USE
                else if(`${key}` === 'ip_count')
                    max = MAX_IP_USE
                else if(`${key}` === 'domain_count')
                    max = MAX_DOMAIN_COUNT

                states.push(utils.generate_step_array(max, Math.ceil(max/10)));
            }
        }
        let cartesian = require('cartesian');
        return cartesian(states);

    }

    /**
     * Async function getting the data from a mongoDb database, parsing them and generating a list of websites
     * matching the states attributes.txt.
     * @param MAX_WEBSITE
     * @returns {Promise<Array>}
     */
    async function init_website_object(MAX_WEBSITE) {
        let persistence = require('../utils/persistence');
        const Url = require('url-parse');

        persistence.mongoInit();
        let docs = await persistence.fetchData(MAX_WEBSITE);


        let attributes = await io_utils.readLines('./data/attributes.txt');

        let unique_attrs = {}
        for(let v of attributes) {
            let split_attr = v.split(' ');
            if(split_attr[1] !== 'nan') {
                unique_attrs[`${split_attr[0]}`] = split_attr[1];
            }
        }

        let websites = {};
        let counter = 0;

        let csv = await io_utils.read_csv_file('./data/data_rl_bot.csv');

        return new Promise((resolve, reject) => {
            try {
                docs.forEach((doc) => {
                    counter++;
                    let hostname = new Url(doc.url).host;
                    let website_obj = {};
                    website_obj['hostname'] = io_utils.extract_rootDomaine(hostname);
                    website_obj['urls'] = [];
                    website_obj['visits'] = 0;
                    website_obj['uas'] = [];
                    website_obj['ips'] = [];
                    for (let val of doc.scripts) {
                        if (new Url(val.name).host === hostname) {
                            website_obj['urls'].push(val.name);
                            for (let key in val.attributes) {
                                if (key in unique_attrs)
                                    website_obj[unique_attrs[key]] = states_attributes[unique_attrs[key]]
                            }

                        }
                    }
                    websites[io_utils.extract_rootDomaine(hostname)] = website_obj;
                });

                for(let key in csv) {
                    if(key in websites) {
                       for(let inside_key in csv[`${key}`]) {
                           if(inside_key === 'hasFingerprinting')
                               websites[key]['fingerprinting'] = csv[`${key}`]['hasFingerprinting'];
                           else if(inside_key === 'blocked')
                               websites[key]['block_bots'] = csv[`${key}`]['blocked'];
                       }
                    }
                }
                resolve(websites);
            }catch(err) {
                reject(err);
            }
        });
    }

    /**
     * 0: Change UA
     * 1: Change IP
     * 2: Use proxy
     * 3: Load pictures
     * 4: Unload pictures
     * 5: Run css
     * 6: Change screen size
     * 7: Use plugins
     * @param action
     * @param bot
     */
    function do_action(action, bot) {

    }



    return {
        set_states: set_states,
        init_website_object: init_website_object,
    }

}

module.exports = new EnvironmentController();
