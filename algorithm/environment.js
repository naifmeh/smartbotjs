
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

    function init_website_object() {
        let fs = require('fs');
        let path = require('path');

        fs.readdir(WEBSITES_DATA_FOLDER, function(err, files) {
            if(err) {
                logger.log('error', 'Directory could not be listed');
                throw new Error('Directory could not be listed');
            }

            files.forEach(function(file, index) {
                let filePath = path.join(WEBSITES_DATA_FOLDER, file);
            })
        })


    }

    return {
        set_states: set_states,
    }

}

module.exports = new EnvironmentController();
new EnvironmentController().set_states();