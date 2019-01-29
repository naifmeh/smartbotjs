
module.exports.crawler = class Crawler {

    constructor() {
        this._ip = 'localhost';
        this._useragent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36"
        this._url = '';
        this._runCss = true;
        this._plugins = false;
        this._loadPictures = true;
        this._webdriver = false;
    }

    setIp(value) {
        this._ip = value;
    }

    getIp() {
        return this._ip;
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
    let ip = crawler.getIp();
    console.log('Ip'+ ip);
    let user_agent = crawler.getUserAgent();
    let url = crawler.getUrl();
    let viewportType = "desktop";
    let loadPictures = crawler.getLoadPictures();
    let runCss = crawler.getRunCss();
    let plugins = crawler.getPlugins();
    let webdriver = crawler.getWebdriver();



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
        let timeout;
        let sigint_cntr = 0;
        let siginthandler = () => {
            sigint_cntr++;
            console.log('Caught SIGINT...');
            setTimeout(()=> {
                sigint_cntr = 0;
            },7000); //Remise a zero du compteur de sigint apres 7 secondes
            if(sigint_cntr == 1)
                throw new Error('SIGINT requested');
            else if(sigint_cntr == 3)
                process.exit(-1);

        };
        process.on('SIGINT', siginthandler);
        let browser;
        const fs = require('fs');
        try {


            let properties = {};
            properties.args = [];
            if(debug) {
                properties.headless = false;
            }

            properties.args.push('--disable-notifications');
            properties.args.push('--no-sandbox');

            browser = await puppeteer.launch(properties);
            browser.on('disconnected', () => {
                console.log('sleeping 100ms'); //  sleep to eliminate race condition  
                setTimeout(function(){
                console.log(`Browser Disconnected... Process Id: ${process}`);
                child_process.exec(`kill -9 ${process}`, (error, stdout, stderr) => {
                    if (error) {
                    console.log(`Process Kill Error: ${error}`)
                    }
                    console.log(`Process Kill Success. stdout: ${stdout} stderr:${stderr}`);
                });
            }, 100);
            });
            const page = await browser.newPage();
            if(user_agent !== undefined) {
                await page.setUserAgent(user_agent);
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
                if(!loadPictures && !runCss) {
                    await page.on('request', (req) => {
                        if (['image', 'stylesheet'].indexOf(req.resourceType()) > -1) {
                            req.abort();
                        } else {
                            req.continue();
                        }
                    });
                }
                else if (!loadPictures && runCss) {
                    await page.on('request', (req) => {
                        if (req.resourceType() === 'image') {
                            req.abort();
                        } else {
                            req.continue();
                        }
                    });
                }
                else if (!runCss && loadPictures) {
                    await page.on('request', (req) => {
                        if(req.resourceType() === 'stylesheet') {
                            req.abort();
                        } else {
                            req.continue();
                        }
                    });
                }
            }
            let link = url;
            if(!regexOccurence(url, /http[s]*:\/\/.+/gm))
                link = 'http://'+url;

            timeout = setTimeout(()=> {
                (async() => {
                    throw new Error("Error with browser instance");
                })();
            }, 50000);
            page.on('unhandledRejection', () => {
                throw new Error('Unhandled rejection inside of browser');
            });
            page.on('uncaughtException', () => {
                throw new Error('Uncaught exception inside browser');
            });


            let response = await page.goto(link, {timeout:30000, waitUntil:'networkidle2'});
            let status = response._status;
            if (status === undefined) {
                link = link.replace('http', 'https');
                response = await page.goto(link,{timeout:30000, waitUntil:'networkidle2'});
                status = response._status;
            }

            let content = await page.content();


            const captchaOcc = regexOccurence(content, /(captcha)+/gi);
            const cloudflareOcc = regexOccurence(content, /(cloudflare)+/ig);
            const pleaseAllowOcc = regexOccurence(content, /(Please allow up)([A-Za-z ])+([0-9])+( seconds)+/gi);

            if (pleaseAllowOcc >= 1 && cloudflareOcc >= 1) {
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            if (action === 'screenshot') {
                await page.screenshot({path: `${__dirname}/screenshots/currentPicture.png`, fullPage: true});
            }
            let stats = fs.statSync(`${__dirname}/screenshots/currentPicture.png`);


            let propertyObject = {};
            propertyObject.fileSize = stats.size;
            propertyObject.captchaOccurence = captchaOcc;
            propertyObject.cloudflareOccurence = cloudflareOcc;
            propertyObject.pleaseAllowOccurence = pleaseAllowOcc;
            propertyObject.responseCode = status;

            
            clearTimeout(timeout);
            return Promise.resolve(propertyObject);
        }catch(err) {
            console.error(err);
        
            let propertyObject = {};
            propertyObject.unknown = true;
            clearTimeout(timeout);
            return Promise.resolve(propertyObject);
        } finally {
            if(browser !== undefined) await browser.close()
            console.log('Finished crawl...');
            process.removeListener('SIGINT', siginthandler)
        }


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

