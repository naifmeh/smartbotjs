
function IO_Utils() {

    const logger = require('../utils/logging.js').Logger('io_utils');

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

    function read_xml_file(file_path) {
        let fs = require('fs'),
            xml2js = require('xml2js');

        let parser = new xml2js.Parser();

        fs.readFile(file_path, function(err, data) {
            if(err) {
                logger.log('error', 'Could not open xml file.');
                throw new Error('Could not open xml file.');
            }
            parser.parseString(data, function(error, result) {
                console.log(result);
            });



        })
    }

    function list_folder(folder_path) {
        let fs = require('fs'),
            files_folder = [];

        fs.readdir(folder_path, function(err, files) {
            if(err) {
                logger.log('error', 'Could not list directory');
                throw new Error('Could not list directory.');
            }

            files.forEach(function (file, index) {
                let chemin = path.join(folder_path, file)

                fs.stat(chemin, function(error, stat) {
                    if(error) {
                        logger.log('error', 'Error stating file.');
                        throw new Error('Error stating file');
                    }

                    if(stat.isFile())
                        files_folder.push(chemin);

                });
            });

        });

        return files_folder;
    }

    return {
        extract_hostname: extract_hostname,
        extract_rootDomaine: extract_rootDomaine,
        list_folder: list_folder,
        read_xml_file: read_xml_file,
    }
}

module.exports.io_utils = new IO_Utils();
new IO_Utils().read_xml_file('../preprocessing/data/naifmehanna.xyz.xml');