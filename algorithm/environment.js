
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


    function set_states() {
        let utils = require('./utils.js').algo_utils;

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

    async function init_website_object() {
        let io_utils = require('../utils/io_utils.js');




    }

    return {
        set_states: set_states,
        init_website_object: init_website_object,
    }

}

module.exports = new EnvironmentController();
