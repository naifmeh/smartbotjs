const Sitemap = require('sitemap-generator');
const logger = require('../utils/logging.js').Logger('preprocessing');

const MAX_ENTRIES_SITEMAP = 20

function PreprocessingController() {

    function generate_sitemap(website) {
        const extractor = require('../utils/io_utils.js').io_utils;
        const generator = Sitemap(website, {
            stripQuerystring: true,
            filepath: `./data/${extractor.extract_hostname(website.trim())}.xml`,
            maxEntriesPerFile: MAX_ENTRIES_SITEMAP,
        });
        generator.on('add', (url)=> {
            logger.log('debug', `Added ${url}`);
        });
        generator.on('done', () => {
            logger.log('info', `Sitemap for ${website} done.`);
        });

        generator.start();
    }

    return {
        generate_sitemap:  generate_sitemap
    };
}

module.exports = new PreprocessingController();
new PreprocessingController().generate_sitemap("http://naifmehanna.xyz");