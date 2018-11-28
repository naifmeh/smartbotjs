
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
     * Async function to read a file line by line and store each line in a string array
     * @param file_path the path to the file to read
     * @returns {Promise<never>} a promise resolving on the array
     */
    async function readLines(file_path) {
        let fs = require('fs');

        let remaining = '';
        let line_array = [];
        try {
            let readStream = fs.createReadStream(file_path);
            readStream.on('data', function (data) {
                remaining += data;
                let index = remaining.indexOf('\r');
                while (index > -1) {
                    let line = remaining.substr(0, index);
                    remaining = remaining.substr(index + 1);
                    line_array.push(line.split('\n').length == 2 ? line.split('\n')[1] : line);
                    index = remaining.indexOf('\r');
                }
            });

            return new Promise((resolve) => {
                readStream.on('end', function () {
                    if (remaining.length > 0) {
                        line_array.push(remaining.split('\n').length == 2 ? remaining.split('\n')[1] : remaining);
                        resolve(line_array);
                    }
                });
            });
        } catch(err) {
            logger.log('error', err.stack);
            return Promise.reject(err);
        }
    }


    async function read_csv_file(filepath,mode='normal', delimit=',') {
        let fs = require('fs');
        try {
            let stream = fs.createReadStream(filepath);

            let csv = require('fast-csv');

            return new Promise((resolve) => {
                let csv_obj = {};
                let csv_arr = [];
                csv.fromStream(stream, {
                    headers: true,
                    delimiter: delimit,
                }).on('data', function(data){
                    if(mode === 'features')
                        csv_obj[data.hostname] = data;
                    else
                        csv_arr.push(data);
                }).on('end', function() {
                    if(mode === 'features')
                        resolve(csv_obj);
                    else
                        resolve(csv_arr);
                });
            });
        } catch(err) {
            return Promise.reject(err);
        }
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
        readLines: readLines,
        read_csv_file: read_csv_file,
    }
}

module.exports = new IO_Utils();

