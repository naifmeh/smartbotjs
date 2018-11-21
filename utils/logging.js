const winston = require('winston');

function Logger(filename) {
    if(typeof filename !== 'string') {
        throw new TypeError('Filename must be a string');
    }
    let options = {
        file_combined: {
            level: 'debug',
            filename: `../logs/app_debug.log`,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5 mb
            maxFiles: 10,
            colorize: true,
            timestamp: true,
        },
        file_app_silly: {
            level: 'silly',
            filename: `../logs/${filename}_silly.log`,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5 mb
            maxFiles: 10,
            colorize: true,
            timestamp: true,
        },
        file_info: {
            level: 'info',
            filename: `../logs/${filename}.log`,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5 mb
            maxFiles: 10,
            colorize: true,
            timestamp:true,
        },
        console: {
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true,
        }
    };

    function log(level, txt) {
        let logger =  winston.createLogger({
            transports: [
                new winston.transports.File(options.file_info),
                new winston.transports.File(options.file_combined),
            ],
            exitOnError: false, //do not exit on handled exceptions
        });
        if(process.env.NODE_ENV !== 'production') {
            logger.add(new winston.transports.Console(options.console));
        }
        logger.log(level, txt);
    }

    return {
        log: log,
    }
}

module.exports.Logger = function(filename) {
    return new Logger(filename);
}