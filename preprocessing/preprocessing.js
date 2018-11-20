const Sitemap = require('sitemap-generator');
const MAX_ENTRIES_SITEMAP = 20

function PreprocessingController() {

    function generate_sitemap(website) {
        const generator = Sitemap(website, {
            stripQuerystring: true,
            filepath: `./data/${website.trim()}.xml`,
            maxEntriesPerFile: MAX_ENTRIES_SITEMAP,
        });
        generator.on('add', (url)=> {
            console.log(url);
        });
        generator.on('done', () => {
            console.log(`Sitemap for ${website} done.`);
        });

        generator.start();
    }

    return {
        generate_sitemap:  generate_sitemap
    };
}

var prepr = PreprocessingController();
prepr.generate_sitemap("http://naifmehanna.xyz");