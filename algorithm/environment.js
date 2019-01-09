
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
    const serialiser = require('../utils/serialisation');
    const Crawler = require('../crawler/crawler').crawler;
    const crawler_controller = require('../crawler/crawler').controller().CrawlerController;

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
    let actions_index;

    //Variables
    let current_website;
    let current_state;
    let current_action;
    let current_crawler;
    let current_reward;
    let length_episode = 0;
    let current_step = 0;
    let current_website_key = 0;

    //Process
    let IS_LOADED = false;
    let WEBSITES_OFF_DB = false;

    function getEnvironmentData() {
        return {
            websites: websites,
            websites_keys: websites_keys,
            states: states,
            actions: actions,
            useragent_usage: useragent_usage,
            proxies_usage: proxies_usage,
            current_website: current_website,
            current_state: current_state,
            current_action: current_action,
            current_crawler: current_crawler,
            length_episode: length_episode,
            actions_index: actions_index,
            current_step: current_step,
            current_reward: current_reward,
            current_website_key: current_website_key,
        }
    }

    async function setEnvironmentData(data) {
        await init_miscellaneaous();
        return new Promise((resolve, reject) => {
            IS_LOADED = true;
            websites = data.websites;
            websites_keys = data.websites_keys;
            states = data.states;
            actions = data.actions;
            useragent_usage = data.useragent_usage;
            proxies_usage = data.proxies_usage;
            current_website = data.current_website;
            current_state = data.current_state;
            current_action = data.current_action;
            current_crawler = data.current_crawler;
            length_episode = data.length_episode;
            current_step = data.current_step;
            current_reward = data.current_reward;
            current_website_key = data.current_website_key;
            resolve();
        });

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
     * @returns {Promise<>}
     */
    async function init_website_object() {
        let persistence = require('../utils/persistence');
        const Url = require('url-parse');
        const mongo = require('mongodb');
        let docs = [];
        try {
            persistence.mongoInit();
            docs = await persistence.fetchData(MAX_WEBSITES);
        } catch(err) {
            if(err instanceof mongo.MongoNetworkError) {
                console.info('Loading from file...');
                websites = await serialiser.unserialise('./websites.json');
                WEBSITES_OFF_DB = true;
            }
            return Promise.resolve(websites);
        }

        docs.filter((val) => {
            if(val.url !== undefined) {
                return val;
            }
        });




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
                    if(doc.url === undefined) console.error('UNDEFINED');
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

        for(let i=0; i< keys.length; i++) {
            let result = [];
            try {
                result = await preprocessing.launch_scrapper(keys[i], 100);
            } catch (err) {
                continue;
            }
            websites[`${keys[i]}`]['urls'] = result;
        }
        await serialiser.serialise(websites, 'websites.json');
        return Promise.resolve();


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

        let actions_index = [];
        for(let i=0;i<output.length; i++) {
            actions_index[i] = i;
        }

        return {
            actions: output,
            actions_index: actions_index,
        };
    }

    /**
     * 0: Change UA
     * 1: Change server
     * 2: Do nothing
     * 3: Load pictures
     * 4: Unload pictures
     * 5: Run css
     * 6: Unrun css
     * 7: Change screen size
     * 8: Use plugins
     * 9: Fake web driver
     * 10: Unfake webdriver
     * @param action
     * @param bot
     */
    function set_action(action_ind, actual_crawler) {
        let action = actions[action_ind];
        let my_crawler = actual_crawler;

        let amt_useless_changes = 0; //punish the bot if the amount of useless change is high

        for(let i=0; i < action.length; i++) {
            switch (action[i]) {
                case 0:
                    let old_useragent = useragent_list.find(actual_crawler.getUserAgent());
                    if (old_useragent !== -1) {
                        if (old_useragent.hasNext()) {
                            //old_useragent.next.data['usage'] += 1;
                            //useragent_usage[old_useragent.next.data] += 1;
                            my_crawler.setUserAgent(old_useragent.next.data);
                        } else {
                            //useragent_list.getHeadNode().data['usage'] += 1;
                            //useragent_usage[useragent_list.getHeadNode().data] += 1;
                            my_crawler.setUserAgent(useragent_list.getHeadNode().data);
                        }
                    }
                    break;
                case 1:

                    break;
                case 2:
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
        let filesize = false;
        let captcha = false;
        let cloudfare = false;
        let responsecode = false;
        if(propObject.fileSize < 100000)
            filesize = true;

        if(propObject.captchaOccurence > 5) //en general plus de 10 captcha sur les sites qui le proposent
            captcha = true;

        if(propObject.cloudflareOccurence > 2) {
            cloudfare = true;
        }
        let flooredStatus = Math.floor(propObject.responseCode/100);
        if(flooredStatus === 4 || flooredStatus === 5) {
            responsecode = true;
        }

        if(cloudfare && propObject.responseCode === 503) {
            return false;
        }

        if (responsecode && captcha && filesize) {
            return true;
        }
        else if (responsecode && captcha) {
            return true;
        }
        else if(responsecode && filesize) {
            return true;
        }
        else if (captcha && filesize) {
            return true;
        }
        else if (responsecode) {
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
        if(!IS_LOADED) {
            states = init_states();
            websites = await init_website_object();
            if(!WEBSITES_OFF_DB)
                await add_websites_url(websites);
            let in_actions = init_actions(N_ACTIONS);
            actions = in_actions.actions;
            actions_index = in_actions.actions_index;
            websites_keys = Object.keys(websites);
            await init_miscellaneaous();

            return new Promise(resolve => {
                current_website = websites[websites_keys[0]];
                current_crawler = new Crawler();
                current_reward = 0;
                current_action = 0;
                length_episode = current_website.urls.length;
                current_state = fit_website_to_state(current_website, current_crawler);
                resolve();
            });
        } else
            return Promise.resolve();
    }

    async function step(action) { //If action is to change server, do not crawl here, its done on set action TODO
        let action_data = set_action(action, current_crawler);
        let done = false;
        //Update useragent
        useragent_usage[current_crawler.getUserAgent()] += 1;

        /* Building the reward info object */
        let reward_info = {};
        reward_info.useless_changes = action_data.changes;
        reward_info.n_actions = action.length; //TODO: Action is not yet a list (OK)

        current_crawler = action_data.crawler;
        if(length_episode === 0)
            current_crawler.setUrl('http://'+current_website.hostname);
        else
            current_crawler.setUrl(current_website.urls[current_step++]);
        console.log(current_crawler.getUrl());
        let crawl_infos =  await crawler_controller(current_crawler).launch_crawler();
        console.log(crawl_infos);
        if(crawl_infos.unknown === true) {
            current_reward = 0;
        } else {
            /* TODO: Maybe put this block into a promise */
            let blocked = is_blocked(crawl_infos); //compute if is blocked
            reward_info.blocked_bot = blocked;

            current_reward = compute_reward(reward_info);
        }
        console.info('Reward : '+current_reward);
        console.info('Action :'+actions[action]);
        current_website.visits += 1;

        if(current_step === length_episode) done = true;

        current_state = fit_website_to_state(current_website, current_crawler);

        //Adding the modifications although we don't really care
        websites[websites_keys[current_website_key]] = current_website;

        let step_infos = {
            state: current_state,
            done: done,
            reward: current_reward,
            episode_length: length_episode,
        };

        return Promise.resolve(step_infos);
    }

    function reset(index) {
        //Getting the new website to visit
        if (index !== 0) {
            current_website_key++;
            current_website = websites[websites_keys[current_website_key]];
            current_state = fit_website_to_state(current_website, current_crawler);
        }

        current_step = 0;
        length_episode = current_website.urls.length;

        return current_state;
    }


    return {
        init_env: init_env,
        reset: reset,
        step: step,
        set_action: set_action,
        getEnvironmentData: getEnvironmentData,
        setEnvironmentData: setEnvironmentData,

    }

}

module.exports = function(){
    return {EnvironmentController: EnvironmentController }
};



/*(async() => {
        await env_controller.init_env();
        let data = env_controller.getEnvironmentData();
        let step = await env_controller.step(5);
        //let serialising = require('../utils/serialisation');
        //let data2 = await serialising.unserialise('program_state.json');
        //await env_controller.setEnvironmentData(data2);
        /*let crawl = new require('../crawler/crawler').crawler;
        let my_crawler = new crawl();
        my_crawler.setProxy('http://138.94.160.32:33173');
        let websites = await env_controller.init_website_object();
        await env_controller.add_websites_url(websites);
        console.log(websites)*/
        /*let states = env_controller.init_states()
        let result = env_controller.init_actions(11);
        await env_controller.init_miscellaneaous();*/
        /*let state = env_controller.fit_website_to_state({ hostname: 'bnf.fr',
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

})();*/



// Todo (1) : Make the init function (OK)
// Todo (2) : Make the reset function (OK)
// Todo (3) : Make the reward function (OK)
// Todo (4) : Make the step function (OK)
// Todo (5) : Serialize the program
