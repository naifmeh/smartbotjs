
function EnvironmentController(N_WEBSITES) {
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
    const WEBDRIVER = true;
    const DOMAINE_COUNT = true;

    const logger = require('../utils/logging.js').Logger('environment');
    const io_utils = require('../utils/io_utils.js');

    const N_ACTIONS = 11;
    const MAX_WEBSITES = N_WEBSITES;


    let boolean_states_attributes = {
        fingerprinting: FINGERPRINTING,
        screen_size: SCREEN_SIZE,
        block_bots: BLOCK_BOTS,
        mouse_pattern: MOUSE_PATTERN,
        plugins: PLUGINS,
        webdriver: WEBDRIVER,
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
        webdriver: WEBDRIVER,
        domain_count: DOMAINE_COUNT,
        ua_count: UA_COUNT,
        ip_count: IP_COUNT,
    };

    let user_agents;
    let useragents_list;
    let proxies;
    let proxies_list;

    let websites;
    let states;
    let actions;

    /**
     * Function setting up the list of possibles states using cartesian permutations.
     * @returns {Array}
     */
    function init_states() {
        let utils = require('./utils.js').algo_utils;

        states = [];

        for(let key in boolean_states_attributes) {
            if(boolean_states_attributes[`${key}`] === true) {
                states.push([true, false]);
            }
        }

        for(let key in numeric_states_attributes) {
            if(numeric_states_attributes[`${key}`] === true) {
                let max = 0;
                if(`${key}` === 'ua_count')
                    max = MAX_UA_USE;
                else if(`${key}` === 'ip_count')
                    max = MAX_IP_USE;
                else if(`${key}` === 'domain_count')
                    max = MAX_DOMAIN_COUNT;

                states.push(utils.generate_step_array(max, Math.ceil(max/10)));
            }
        }

        let cartesian = require('cartesian');
        states = cartesian(states);
        return states;

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

        let unique_attrs = {};
        for(let v of attributes) {
            let split_attr = v.split(' ');
            if(split_attr[1] !== 'nan') {
                unique_attrs[`${split_attr[0]}`] = split_attr[1];
            }
        }

        websites = {};
        let counter = 0;

        let csv = await io_utils.read_csv_file('./data/data_rl_bot.csv','features');

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
                        }
                        for (let key in val.attributes) {
                            if (key in unique_attrs)
                                website_obj[unique_attrs[key]] = states_attributes[unique_attrs[key]]
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

    async function add_websites_url(websites) {
        const preprocessing = require('../preprocessing/preprocessing');
        let keys = Object.keys(websites);
        let compteur = 0;
        let done = false;
        return new Promise((resolve, reject) => {
            try {
                for(let i=0; i< keys.length; i++) {
                    let result = preprocessing.generate_sitemap('http://' + keys[i], function (urls) {
                        for (let j = 0; j < urls.length; j++) {
                            websites[`${keys[i]}`]['urls'].push(urls[j]);
                        }
                        compteur++;
                        console.log(compteur)
                        if(compteur === keys.length) {
                            resolve();
                        }

                    });
                }

            } catch (err) {
                reject(err);
            }
        });
    }

    async function init_miscellaneaous() {
        const utils = require('./utils').algo_utils;
        try {
            user_agents = io_utils.readLines('./data/useragents.txt');
            useragents_list = utils.reformat_useragents(user_agents);
            proxies = await io_utils.read_csv_file('./data/proxies.csv');
            proxies_list = utils.reformat_proxies(proxies);

            return Promise.resolve();
        }catch(err) {
            return Promise.reject(err);
        }
    }

    function init_actions(NUM_ACTIONS) {
        const math_utils = require('../utils/math_utils.js');
        let elementary_actions = Array.from(Array(NUM_ACTIONS).keys());
        let output = [];

        for(let i=1; i <= NUM_ACTIONS; i++) {
            math_utils.combinations(elementary_actions, i, output);
        }

        return output;
    }

    /**
     * 0: Change UA
     * 1: Change IP
     * 2: Use proxy
     * 3: Load pictures
     * 4: Unload pictures
     * 5: Run css
     * 6: Unrun css
     * 7: Change screen size
     * 8: Use plugins
     * 9: Fake webdriver
     * 10: Unfake webdriver
     * @param action
     * @param bot
     */
    function set_action(action, actual_crawler) {
        //const Crawler = require('../crawler/crawler').crawler;
        let my_crawler = actual_crawler;

        let amt_useless_changes = 0; //punish the bot if the amount of useless change is high

        for(let i=0; i<action.length; i++) {
            switch (action[i]) {
                case 0:
                    let old_useragent = useragents_list.find(actual_crawler.getUserAgent());
                    if (old_useragent !== -1) {
                        if (old_useragent.hasNext()) {
                            old_useragent.next.data['usage'] += 1;
                            my_crawler.setUserAgent(old_useragent.next.data);
                        } else {
                            useragents_list.getHeadNode().data['usage'] += 1;
                            my_crawler.setUserAgent(useragents_list.getHeadNode().data);
                        }
                    }
                    break;
                case 1:
                    break;
                case 2:
                    let old_proxy = proxies_list.find(actual_crawler.getProxy());
                    if (old_proxy !== -1) {
                        let new_proxy;
                        if (old_proxy.hasNext()) {
                            old_proxy.next.data['usage'] += 1;
                            new_proxy = old_proxy.next.data;
                            my_crawler.setProxy(new_proxy);
                        }
                        else {
                            proxies_list.getHeadNode().data['usage'] += 1;
                            new_proxy = proxies_list.getHeadNode().data;
                            my_crawler.setProxy(proxies_list.getHeadNode().data['proxy']);
                        }
                    }
                    break;
                case 3:
                    if (actual_crawler.getLoadPictures() === true)
                        amt_useless_changes += 1;
                    my_crawler.setLoadPictures(true);
                    break;
                case 4:
                    if (actual_crawler.getLoadPictures() === false)
                        amt_useless_changes += 1
                    my_crawler.setLoadPictures(false);
                    break;
                case 5:
                    if (actual_crawler.getRunCss() === true)
                        amt_useless_changes += 1;
                    my_crawler.setRunCss(true);
                    break;
                case 6:
                    if (actual_crawler.getRunCss === false)
                        amt_useless_changes += 1;
                    my_crawler.setRunCss(false);
                    break;
                case 7:
                    if (actual_crawler.getPlugins() === true)
                        amt_useless_changes += 1;
                    my_crawler.setPlugins(true);
                    break;
                case 8:
                    if (actual_crawler.getPlugins() === false)
                        amt_useless_changes += 1;
                    my_crawler.setPlugins(false);
                    break;
                case 9:
                    if (actual_crawler.getWebdriver() === true)
                        amt_useless_changes += 1;
                    my_crawler.setWebdriver(true);
                    break;
                case 10:
                    if (actual_crawler.getWebdriver() === false)
                        amt_useless_changes += 1;
                    my_crawler.setWebdriver(false);
                default:
                    break;
            }
        }

        return {crawler: my_crawler, changes: amt_useless_changes};
    }

    function compute_reward(stepData) {
        let reward = 0;
        if(!stepData.blocked_bot)
            reward += 5;
        else
            reward -= 5;

        if(stepData.useless_changes >= 0)
            reward -= stepData.useless_changes * 0.1;

        if(stepData.n_actions > 1)
            reward -= stepData.n_actions * 0.05;

        return reward;
    }



    async function init_env() {
         states = init_states();
         websites = await init_website_object(MAX_WEBSITES);
         actions = init_actions(N_ACTIONS);
    }



    return {
        init_states: init_states,
        init_website_object: init_website_object,
        add_websites_url: add_websites_url,
        set_action: set_action,
        init_actions: init_actions,
        init_miscellaneaous: init_miscellaneaous,
        compute_reward: compute_reward,
    }

}

module.exports = new EnvironmentController();
let websites;
let env_controller = new EnvironmentController();
(async() => {
    try {
        let crawl = new require('../crawler/crawler').crawler;
        let my_crawler = new crawl();
        my_crawler.setProxy({proxy: 'http://113.254.114.24:8380', usage: 0});

        let result = env_controller.init_actions(11);
        await env_controller.init_miscellaneaous();
        websites = await env_controller.init_website_object(10);
        //await env_controller.add_websites_url(websites);
        //console.log(websites);
        let crawler = env_controller.set_action(2, my_crawler);
    } catch(err) {
        console.log(err);
    }
})();

// Todo (1) : Make the init function
// Todo (2) : Make the reset function
// Todo (3) : Make the reward function
// Todo (4) : Make the step function
// Todo (5) : Serialize the program
