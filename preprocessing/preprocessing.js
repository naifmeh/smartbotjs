


function PreprocessingController() {
    const MAX_ENTRIES_SITEMAP = 20;
    const Sitemap = require('sitemap-generator');
    const logger = require('../utils/logging.js').Logger('preprocessing');

    async function launch_scrapper(url, limit) {
        const puppeteer = require('puppeteer');
        const io_utils = require('../utils/io_utils');
        const _cliProgress = require('cli-progress');
        const regexOccurence = require('regex-occurrence');
        let score = 0;
        try {

            const browser = await puppeteer.launch({
                headless:true,
            });

            const page = await browser.newPage();

            let response = await page.goto('http://'+url+'/',{"waitUntil" : "networkidle0"});
            let status = response._status;
            if(status === undefined) {
                console.info('Retrying...');
                response = await page.goto('https://'+url+'/', {"waitUntil" : "networkidle0"});
                status = response._status;
            }
            //await page.addScriptTag({url:"http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"});
            console.info('Page response code', status);


            let content = await page.content();
            const occCloudFare = regexOccurence(content, /(cloudflare)+/ig);
            const occPleaseAllow = regexOccurence(content, /(Please allow up)([A-Za-z ])+([0-9])+( seconds)+/gi);
            if(occPleaseAllow >= 1) {
                console.log('Waiting for cloudfare to resolve...');
                await new Promise(resolve => setTimeout(resolve, 10000));
                console.log('Done');
            }
            let links = await page.$$eval('a', as => as.map(a => a.href)); //Recupere liens

            let filtered_links = links.filter((link) => {
                let hostname = io_utils.extract_rootDomaine(link);
                if(hostname === url)
                    return link;
            });

            filtered_links = filtered_links.filter((val, index, self) => {
                return self.indexOf(val) === index;
            });

            let requestCode = Math.floor((status)/100);
            if(requestCode === 4
                || requestCode === 5) {
                score++;
            }

            await browser.close();

            return Promise.resolve(filtered_links.slice(0,limit));


        } catch(err) {
            return Promise.reject(err);
        }
    }

    function generate_sitemap(website, callback) {

        const io_utils = require('../utils/io_utils.js');
        const generator = Sitemap(website, {
            stripQuerystring: true,
            filepath: `${__dirname}/data/websites/${io_utils.extract_hostname(website.trim())}.xml`,
            });
        let compteur = 0;
        let urls = [];
        generator.on('add', (url)=> {

            //bar.update(compteur);
            if(io_utils.validate_url(url)) {
                compteur++;
                urls.push(url);
            }
            logger.log('debug', `Added ${url}`);
            if(compteur === MAX_ENTRIES_SITEMAP) {
                generator.stop();
                if(callback) {
                    callback(urls);
                }

            }
        });

        generator.on('error', (err)=> {
            console.log(err);
        });


        generator.on('done', () => {
            logger.log('info', `Sitemap for ${website} done.`);
            if(callback) {
                callback(urls);
            }

        });
        generator.start();
    }

    return {
        generate_sitemap:  generate_sitemap,
        launch_scrapper: launch_scrapper,
    };
}

module.exports = new PreprocessingController();
(async() => {
    let links = await new PreprocessingController().launch_scrapper('putlockers.fm', 20);
    console.info(links);
})();

