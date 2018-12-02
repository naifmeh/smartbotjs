
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
    const math_utils = require('../utils/math_utils');
    const Crawler = require('../crawler/crawler').crawler;
    const crawler_controller = require('../crawler/crawler').crawler_controller;

    const N_ACTIONS = 11;
    const MAX_WEBSITES = N_WEBSITES;
    let N_STATES;


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
    let useragent_usage;
    let useragent_list;
    let proxies;
    let proxies_list;
    let proxies_usage;
    let my_ip;

    //Environment
    let websites;
    let websites_keys;
    let states;
    let actions;

    //Variables
    let current_website;
    let current_state;
    let current_action;
    let current_crawler;
    let current_reward;
    let length_episode = 0;
    let current_step = 0;
    let current_website_key = 0;

    function getEnvironmentData() {
        return {
            websites: websites,
            websites_key: websites_keys,
            states: states,
            actions: actions,
            useragent_list: useragent_list,
            proxies_list: proxies_list,
            current_website: current_website,
            current_state: current_state,
            current_action: current_action,
            current_crawler: current_crawler,
        }
    }

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
        N_STATES = states.length;
        return states;

    }

    /**
     * Async function getting the data from a mongoDb database, parsing them and generating a list of websites
     * matching the states attributes.txt.
     * @param MAX_WEBSITE
     * @returns {Promise<Array>}
     */
    async function init_website_object() {
        let persistence = require('../utils/persistence');
        const Url = require('url-parse');

        persistence.mongoInit();
        let docs = await persistence.fetchData(MAX_WEBSITES);


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
                    for(let attr of Object.keys(boolean_states_attributes)) {
                        if(boolean_states_attributes[`${attr}`] === false)
                            continue;
                        if(website_obj[`${attr}`] === undefined) {
                            website_obj[`${attr}`] = false;
                        }
                    }
                    websites[io_utils.extract_rootDomaine(hostname)] = website_obj;
                });

                for(let key in csv) {
                    if(key in websites) {
                       for(let inside_key in csv[`${key}`]) {
                           if(inside_key === 'hasFingerprinting')
                               websites[key]['fingerprinting'] = (csv[`${key}`]['hasFingerprinting'] == 'true');
                           else if(inside_key === 'blocked')
                               websites[key]['block_bots'] = (csv[`${key}`]['blocked'] == 'true');
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

            user_agents = await io_utils.readLines('./data/useragents.txt');
            useragent_list = utils.reformat_useragents(user_agents);
            useragent_usage = utils.reformat_with_usage(user_agents);
            proxies = await io_utils.read_csv_file('./data/proxies.csv');
            proxies_list = utils.reformat_proxies(proxies);
            proxies_usage = utils.reformat_with_usage(proxies_list,mode='linked');
            const net = require('net');
            await new Promise((resolve) => {
                const client = net.connect({port: 80, host:"google.com"}, () => {
                    my_ip = client.localAddress;
                    proxies_usage[`${my_ip}`] = 0;
                    client.end();
                    resolve();
                });
            });


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
        let my_crawler = actual_crawler;

        let amt_useless_changes = 0; //punish the bot if the amount of useless change is high

        for(let i=0; i<action.length; i++) {
            switch (action[i]) {
                case 0:
                    let old_useragent = useragent_list.find(actual_crawler.getUserAgent());
                    if (old_useragent !== -1) {
                        if (old_useragent.hasNext()) {
                            //old_useragent.next.data['usage'] += 1;
                            useragent_usage[old_useragent.next.data] += 1;
                            my_crawler.setUserAgent(old_useragent.next.data);
                        } else {
                            //useragent_list.getHeadNode().data['usage'] += 1;
                            useragent_usage[useragent_list.getHeadNode().data] += 1;
                            my_crawler.setUserAgent(useragent_list.getHeadNode().data);
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
                            //old_proxy.next.data['usage'] += 1;
                            proxies_usage[old_proxy.next.data] += 1;
                            new_proxy = old_proxy.next.data;
                            my_crawler.setProxy(new_proxy);
                        }
                        else {
                            //proxies_list.getHeadNode().data['usage'] += 1;
                            proxies_usage[proxies_list.getHeadNode().data] += 1;
                            new_proxy = proxies_list.getHeadNode().data;
                            my_crawler.setProxy(proxies_list.getHeadNode().data);
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
                        amt_useless_changes += 1;
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

    function is_blocked(propObject) {
        let score = 0;
        if(propObject.fileSize < 150000)
            score += 1;

        if(propObject.captchaOccurence > 2)
            score += 2;

        let flooredStatus = Math.floor(propObject.responseCode/100);
        if(flooredStatus === 4 || flooredStatus === 5) {
            score += 4;
        }

        if(score&4 === 4 || score&2===2) {
            return true;
        }
        if(score&4 === 4 && score&2 ===2 && score&1 ===1) {
            return true;
        }
        if(score&4 === 4 && score&2 === 2) {
            return true;
        }

        return false;
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

    function fit_website_to_state(website, actual_crawler) {
        let visits = website.visits;
        let ua_usage = useragent_usage[actual_crawler.getUserAgent()];
        let ip_usage = 0;
        if(actual_crawler.getProxy() !== '') { //TODO: verify this (OK)
            let proxy = actual_crawler.getProxy();
            ip_usage = proxies_usage[proxy];
        } else {
            ip_usage = proxies_usage[my_ip];
        }

        for(let i=0; i<states.length;i++) {
            if(website['fingerprinting'] === states[i][0] &&
                website['screen_size'] === states[i][1] &&
                website['block_bots'] === states[i][2] &&
                website['plugins'] === states[i][3] &&
                website['webdriver'] === states[i][4] &&
                website['ua_proxy'] === states[i][5]) {
                if((visits >= states[i][6][0] && visits < states[i][6][1]) &&
                    (ua_usage >= states[i][7][0] && ua_usage < states[i][7][1]) &&
                    (ip_usage >= states[i][8][0] && ip_usage < states[i][8][1])) {
                    return states[i];
                }

            }
        }

    }

    async function init_env() {
         states = init_states();
         websites = await init_website_object(MAX_WEBSITES);
         actions = init_actions(N_ACTIONS);
         websites_keys = Object.keys(websites);
         await init_miscellaneaous();

         return new Promise(resolve => {
            current_website = math_utils.randomItem(websites_keys);
            current_crawler = new Crawler();
            current_reward = 0;
            current_action = 0;
            length_episode = current_website.urls.length;
            current_state = fit_website_to_state(current_website, current_crawler);
            resolve();
        });
    }

    async function step(action) {
        let action_data = set_action(action, current_crawler);
        let done = false;
        /* Building the reward info object */
        let reward_info = {};
        reward_info.useless_changes = action_data.changes;
        reward_info.n_actions = action.length; //TODO: Action is not yet a list

        current_crawler = action_data.crawler;
        current_crawler.setUrl(current_website.urls[current_step++]);

        let crawl_infos =  await crawler_controller(current_crawler).launch_crawler();

        /* TODO: Maybe put this block into a promise */
        let blocked = is_blocked(crawl_infos); //compute if is blocked
        reward_info.blocked_bot = blocked;

        current_reward = compute_reward(reward_info);
        current_website.visits += 1;

        if(current_step === length_episode) done = true;

        current_state = fit_website_to_state(current_website, current_crawler);

        let step_infos = {
            state: current_state,
            done: done,
            reward: current_reward,
        };

        current_step++;

        return Promise.resolve(step_infos);
    }

    function reset() {
        //Adding the modifications although we don't really care
        websites[websites_keys[current_website_key]] = current_website;

        //Getting the new website to visit
        current_website_key++;
        current_website = websites[websites_keys[current_website_key]];
        current_state = fit_website_to_state(current_website, current_crawler);

        current_step = 0;
        length_episode = current_website.urls.length;
    }





    return {
        init_states: init_states,
        init_website_object: init_website_object,
        add_websites_url: add_websites_url,
        set_action: set_action,
        init_actions: init_actions,
        init_miscellaneaous: init_miscellaneaous,
        compute_reward: compute_reward,
        fit_website_to_state: fit_website_to_state,
        getEnvironmentData: getEnvironmentData,

    }

}

module.exports = new EnvironmentController();
let websites;
let env_controller = new EnvironmentController(10);
(async() => {
    try {
        let crawl = new require('../crawler/crawler').crawler;
        let my_crawler = new crawl();
        my_crawler.setProxy('http://138.94.160.32:33173');
        let websites = await env_controller.init_website_object();
        let states = env_controller.init_states()
        let result = env_controller.init_actions(11);
        await env_controller.init_miscellaneaous();
        let state = env_controller.fit_website_to_state({ hostname: 'bnf.fr',
            urls: [],
            visits: 0,
            uas: [],
            ips: [],
            ua_proxy: true,
            screen_size: true,
            fingerprinting: false,
            block_bots: false,
            plugins: false,
            webdriver: false }, my_crawler);

        let data = env_controller.getEnvironmentData();
    } catch(err) {
        console.log(err);
    }
})();






// Todo (1) : Make the init function (OK)
// Todo (2) : Make the reset function
// Todo (3) : Make the reward function
// Todo (4) : Make the step function
// Todo (5) : Serialize the program
