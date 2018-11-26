
module.exports.crawler = class Crawler {

    constructor() {
        this._proxy;
        this._useragent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        this._url;
        this._runCss = false;
        this._plugins;
        this._loadPictures = false;
    }

    set proxy(value) {
        this._proxy = value;
    }


    set userAgent(value) {
        this._useragent = value;
    }

    set url(value) {
        this._url = value;
    }

    set runCss(value) {
        this._runCss = value;
    }

    set plugins(value) {
        this._plugins = value;
    }

    set loadPictures(value) {
        this._loadPictures = value;
    }

    get proxy() {
        return this._proxy;
    }

    get userAgent() {
        return this._useragent;
    }

    get url() {
        return this._url;
    }

    get runCss() {
        return this._runCss;
    }

    get plugins() {
        return this._plugins;
    }

    get loadPictures() {
        return this._loadPictures;
    }
};

function CrawlerController() {
    let proxy;
    let user_agent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36";
    let url;
    let viewportType = "desktop";
    let loadPictures = true;
    let runCss = true;
    let plugins = '';

    function set_proxy(new_proxy) {
        proxy = new_proxy;
    }

    function set_useragent(new_ua) {
        user_agent = new_ua;
    }

    function set_url(new_url) {
        url = new_url;
    }

    function should_load_pictures(load_pics) {
        loadPictures = load_pics
    }

    function should_run_css(run_css) {
        runCss = run_css
    }

    function set_viewport(vp_type) {
        //Different websites viewport
    }

    function set_plugins(set_plugins) {
        plugins = set_plugins
    }

    async function launch_crawler(action='screenshot', debug=false) {
        const puppeteer = require('puppeteer');

        let properties = {};
        if(debug) {
            properties.headless = true;
        }
        if(user_agent !== undefined) {
            properties.args.push(`--user-agent=${user_agent}`);
        }
        if(proxy !== undefined) {
            properties.args.push(`--proxy-server=${proxy}`);
        }
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        //page.setUserAgent(user_agent);

        if(url === undefined) {
            throw new Error("URL not defined");
        }
        if(!loadPictures || !runCss) {
            await page.setRequestInterception(true);
            if (!loadPictures) {
                page.on('request', (req) => {
                    if (req.resourceType() === 'image') {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });
            }
            if (!runCss) {
                page.on('request', (req) => {
                    if(req.resourceType() === 'stylesheet') {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });
            }
        }
        const response = await page.goto(url);
        if(action === 'screenshot') {
            await page.screenshot({path: `screenshots/${url}.png`});
        }

        await browser.close();

        return Promise.resolve(response);
    }
}
module.exports.crawler_controller = function() {
    return {
        CrawlerController: CrawlerController,
    }
};

