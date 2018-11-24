
function EnvironmentController() {
    const FINGERPRINTING = true;
    const SCREEN_SIZE = true;
    const BLOCK_BOTS = true;
    const MOUSE_PATTERN = false;
    const PLUGINS = true;
    const UA_PROXY = true;
    const UA_COUNT = true;
    const MAX_UA_USE = 10000;
    const MAX_IP_USE = 100;
    const IP_COUNT = true;
    const DOMAINE_COUNT = true;

    const WEBSITES_DATA_FOLDER = '../preprocessing/data/websites';

    const logger = require('../utils/logging.js').Logger('environment');

    function set_states() {
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

    }

    async function init_website_object() {
        let io_utils = require('../utils/io_utils.js');
        return new Promise((resolve, reject) => {
            const folder = async() => {
                let values = await io_utils.list_folder('../preprocessing/data/websites');
                console.log(values());
                resolve(values())
            }
        });



    }

    return {
        set_states: set_states,
        init_website_object: init_website_object,
    }

}

module.exports = new EnvironmentController();
