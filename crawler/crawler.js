
module.exports.crawler = class Crawler {

    constructor() {
        this._proxy = '';
        this._useragent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        this._url = '';
        this._runCss = false;
        this._plugins = false;
        this._loadPictures = false;
        this._webdriver = false;
    }

    setProxy(value) {
        this._proxy = value;
    }

    setWebdriver(value) {
        this._webdriver = false;
    }

    setUserAgent(value) {
        this._useragent = value;
    }

    setUrl(value) {
        this._url = value;
    }

    setRunCss(value) {
        this._runCss = value;
    }

    setPlugins(value) {
        this._plugins = value;
    }

    setLoadPictures(value) {
        this._loadPictures = value;
    }

    getProxy() {
        return this._proxy;
    }

    getWebdriver() {
        return this._webdriver;
    }


    getUserAgent() {
        return this._useragent;
    }

    getUrl() {
        return this._url;
    }

    getRunCss() {
        return this._runCss;
    }

    getPlugins() {
        return this._plugins;
    }

    getLoadPictures() {
        return this._loadPictures;
    }
};

function CrawlerController(crawler) {
    let proxy = crawler.getProxy();
    let user_agent = crawler.getUserAgent();
    let url = crawler.getUrl();
    let viewportType = "desktop";
    let loadPictures = crawler.getLoadPictures();
    let runCss = crawler.getRunCss();
    let plugins = crawler.getPlugins();
    let webdriver = crawler.getWebdriver();

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
        const regexOccurence = require('regex-occurrence');
        const fs = require('fs');

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        let properties = {};
        if(debug) {
            properties.headless = true;
        }
        if(user_agent !== undefined) {
            await page.setUserAgent(user_agent);
        }
        if(proxy !== '') {
            properties.args.push(`--proxy-server=${proxy}`);
        }



        if(url === '') {
            throw new Error("URL not defined");
        }

        if(plugins) {
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                })
            });
        }

        if(webdriver) {
            await page.evaluateOnNewDocument(() => {
                const newProto = Object.getPrototypeOf(navigator);
                delete newProto.webdriver;
                Object.setPrototypeOf(navigator, newProto);
            })
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
                        //req.continue();
                    }
                });
            }
        }
        let response = await page.goto('http://'+url);
        let status = response._status;
        if(status === undefined) {
            response = await page.goto('https://'+url);
            status = response._status;
        }

        let content = await page.content();
        if(action === 'screenshot') {
            await page.screenshot({path: `screenshots/currentPicture.png`, fullPage:true});
        }

        const captchaOcc = regexOccurence(content, /(captcha)+/gi);
        const cloudflareOcc = regexOccurence(content, /(cloudflare)+/ig);
        const pleaseAllowOcc = regexOccurence(content, /(Please allow up)([A-Za-z ])+([0-9])+( seconds)+/gi);

        if(pleaseAllowOcc >= 1) {
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        let stats = fs.statSync('screenshots/currentPicture.png');

        let propertyObject = {};
        propertyObject.fileSize = stats.size;
        propertyObject.captchaOccurence = captchaOcc;
        propertyObject.cloudflareOccurence = cloudflareOcc;
        propertyObject.pleaseAllowOccurence = pleaseAllowOcc;
        propertyObject.responseCode = status;

        await browser.close();

        return Promise.resolve(propertyObject);
    }

    return {
        launch_crawler: launch_crawler,
    }
}
module.exports.controller = function() {
    return {
        CrawlerController: CrawlerController,
    }
};

