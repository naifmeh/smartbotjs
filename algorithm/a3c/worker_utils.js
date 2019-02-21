
const fs = require('fs');
const http = require('http');

const host = 'localhost';
const port = 33333;


async function set_global_moving_average(avg) {
    const options = {
        hostname: host,
        port: port,
        path: '/global_moving_average',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('statusCode :'+ res.statusCode);
            res.on('data', (d) => {
                resolve(d);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.write('{"data":'+avg+'}');
        req.end();
    });
}

async function get_global_moving_average() {
    const options = {
        hostname: host,
        port: port,
        path: '/global_moving_average',
        method: 'GET'
    };
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log(`statusCode: ${res.statusCode}`);
            res.on('data', (d) => {
                resolve(JSON.parse(d.toString('utf8')).data);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    }); 
}

async function set_best_score(score) {
    const options = {
        hostname: host,
        port: port,
        path: '/best_score',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('statusCode :'+ res.statusCode);
            res.on('data', (d) => {
                resolve(d.toString('utf8'));
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.write('{"data":'+score+'}');
        req.end();
    });
}

async function get_best_score() {
    const options = {
        hostname: host,
        port: port,
        path: '/best_score',
        method: 'GET'
    };
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log(`statusCode: ${res.statusCode}`);
            res.on('data', (d) => {
                resolve(d.toString('utf8').data);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    }); 
}

async function send_model(worker_id) {
    const options = {
        hostname: host,
        port: port,
        path: '/local_model_weights',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('statusCode :'+ res.statusCode);
            res.on('data', (d) => {
                resolve(d.toString('utf8'));
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        let obj = {};
        obj.idx = worker_id;
        obj.data_actor = fs.readFileSync(__dirname+'/local-model-actor/weights.bin', {encoding: 'base64'});
        obj.data_critic = fs.readFileSync(__dirname+'/local-model-critic/weights.bin', {encoding: 'base64'});
        req.write(JSON.stringify(obj));
        req.end();
    });
}

async function get_global_model() {
    const options = {
        hostname: host,
        port: port,
        path: '/global_model_weights',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('statusCode :'+ res.statusCode);
            res.on('data', (d) => {
                resolve(d.toString('utf8')); //TODO: enregistrer le modele ?
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

async function write_queue(val) {
    const options = {
        hostname: host,
        port: port,
        path: '/queue',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('statusCode :'+ res.statusCode);
            res.on('data', (d) => {
                resolve(d.toString('utf8'));
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        let obj = {};
        obj.data = val;
        req.write(JSON.stringify(obj));
        req.end();
    });
}

async function get_queue() {
    const options = {
        hostname: host,
        port: port,
        path: '/queue',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('statusCode :'+ res.statusCode);
            res.on('data', (d) => {
                let data = d.toString('utf8');
                if(data === 'NaN') {
                    resolve('Nan');
                } else {
                    resolve(parseInt(data));
                }
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
}

async function start_worker(hostn, portn, idx) {
    const options = {
        hostname: hostn,
        port: portn,
        path: '/start_worker',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('statusCode :'+ res.statusCode);
            res.on('data', (d) => {
                let data = d.toString('utf8');
                resolve(data);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
}

async function increment_global_episode() {

}

module.exports.set_global_moving_average = set_global_moving_average;
module.exports.get_global_moving_average = get_global_moving_average;
module.exports.set_best_score = set_best_score;
module.exports.get_best_score = get_best_score;
module.exports.get_queue = get_queue;
module.exports.write_queue = write_queue;
module.exports.send_model = send_model;
module.exports.get_global_model = get_global_model;
module.exports.start_worker = start_worker;
module.exports.increment_global_episode = increment_global_episode;
