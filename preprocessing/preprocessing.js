


function PreprocessingController() {
    const MAX_ENTRIES_SITEMAP = 20;
    const Sitemap = require('sitemap-generator');
    const logger = require('../utils/logging.js').Logger('preprocessing');

    function generate_sitemap(website, callback) {

        const io_utils = require('../utils/io_utils.js');
        const generator = Sitemap(website, {
        stripQuerystring: true,
        filepath: `${__dirname}/data/websites/${io_utils.extract_hostname(website.trim())}.xml`,
        maxEntriesPerFile: MAX_ENTRIES_SITEMAP,
        });
        let compteur = 0;
        let urls = [];
        generator.on('add', (url)=> {
            compteur++;
            urls.push(url);
            //logger.log('debug', `Added ${url}`);
            if(compteur == MAX_ENTRIES_SITEMAP) {
                if(callback) {
                    callback(urls);
                }
                generator.stop();
            }
        });
        /*generator.on('error', (error) => {
            generator.stop();
        });*/

        generator.on('done', () => {
            logger.log('info', `Sitemap for ${website} done.`);
            if(callback) {
                callback(urls);
            }

        });
        generator.start();




    }

    return {
        generate_sitemap:  generate_sitemap
    };
}

module.exports = new PreprocessingController();

