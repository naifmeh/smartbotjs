
function IO_Utils() {

    const logger = require('../utils/logging.js').Logger('io_utils');

    /**
     * Extract the hostname from a given url. Ex:
     * If you pass http://www.google.com/search. You get www.google.com
     * @param url The full url
     * @returns {string} The domain
     */
    function extract_hostname(url) {
        var hostname;
        if(typeof url !== 'string') {
            throw new TypeError('Argument should be a string');
        }
        if(url.indexOf("//") > -1) {
            hostname = url.split('/')[2];
        } else {
            hostname = url.split('/')[0];
        }

        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];

        return hostname;
    }

    function extract_rootDomaine(url) {
        var domain = extract_hostname(url),
            splitArr = domain.split('.'),
            arrLen = splitArr.length;

        if(arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen -1];
            if(splitArr[arrLen - 2].length == 2 && splitArr[arrLen -1].length ==2) {
                domain = splitArr[arrLen - 3] + '.' + domain;
            }
        }

        return domain
    }

    /**
     * Async function reading an XML file given by it's path and returning
     * a promise.
     * @param file_path The absolute or relative file path
     * @returns {Promise<*>} Promise resolving in a json object containing the xml file structure
     */
    async function read_xml_file(file_path) {
        let fs = require('fs'),
            xml2js = require('xml2js');
        let parser = new xml2js.Parser();

        return new Promise((resolve, reject) => {
            fs.readFile(file_path, function(err, data) {
                if(err) {
                    reject(err);
                }
                parser.parseString(data, function(error, result) {
                    resolve(result);
                });
            });
        });


    }

    /**
     * List each file in the specified folder given by its path
     * @param folder_path The folder path
     * @returns {Array} Array of filenames in the folder.
     */
    async function list_folder(folder_path) {
        let fs = require('fs'),
            path = require('path');


        return new Promise((resolve, reject) => {
            let files_folder = [];
            fs.readdir(folder_path, function (err, files) {
                if (err) {
                    logger.log('error', 'Could not list directory');
                    reject(err);
                }

                files.forEach(function (file, index) {
                    let chemin = path.join(folder_path, file)

                    fs.stat(chemin, function (error, stat) {
                        if (error) {
                            logger.log('error', 'Error stating file.');
                            reject(err);
                        }
                        if (stat.isFile()) {
                            files_folder.push(chemin);
                        }
                        if(files.length == index+1)
                            resolve(files_folder)
                    });
                });


            });
        });
    }

    return {
        extract_hostname: extract_hostname,
        extract_rootDomaine: extract_rootDomaine,
        list_folder: list_folder,
        read_xml_file: read_xml_file,
    }
}

module.exports.io_utils = new IO_Utils();

