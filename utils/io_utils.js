
function IO_Utils() {

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

    return {
        extract_hostname: extract_hostname,
        extract_rootDomaine: extract_rootDomaine
    }
}

module.exports.io_utils = new IO_Utils();