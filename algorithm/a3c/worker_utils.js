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

async function create_queue() {
    const options = {
        hostname: host,
        port: port,
        path: '/create_queue',
        method: 'GET',
    };
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
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
                let data = JSON.parse(d.toString('utf8')).data;
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

async function get_blocking_queue() {
    async function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    let data = 'NaN';
    while(data === 'NaN') {
        data = await get_queue();
        sleep(1000);
    }
    return data;
}

async function start_worker(hostn) {
    let host_port = hostn.split(':');
    const options = {
        hostname: host_port[0],
        port: host_port[1],
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
    const options = {
        hostname: host,
        port: port,
        path: '/global_episode',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
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

async function notify_worker_done() {
    const options = {
        hostname: host,
        port: port,
        path: '/worker_done',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                resolve(d);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
}

async function get_global_model_critic() {
    const options = {
        hostname: host,
        port: port,
        path: '/global_model_weights_critic',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                let buffer = new Buffer(d, 'binary');
                fs.writeFileSync(__dirname+'/local-model-critic/weights.bin', buffer);
                resolve(data);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
}

async function get_global_model_actor() {
    const options = {
        hostname: host,
        port: port,
        path: '/global_model_weights_actor',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                let buffer = new Buffer(d, 'binary');
                fs.writeFileSync(__dirname+'/local-model-actor/weights.bin', buffer);
                resolve(data);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });

}

async function get_global_episode() {
    const options = {
        hostname: host,
        port: port,
        path: '/global_episode',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                resolve(parseInt(JSON.parse(d.toString('utf8')).data));
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
}

async function set_global_episode(ep) {
    const options = {
        hostname: host,
        port: port,
        path: '/global_episode',
        method: 'POST',
        headers: {
            'Content-Type':'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                resolve(d);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.write('{"data":'+ep+'}');
        req.end();
    });
}

async function wait_for_workers() {

}

async function add_worker_token(tok) {
    const options = {
        hostname: host,
        port: port,
        path: '/worker_started',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.on('data', (d) => {
                resolve(d);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
}

function get_workers_hostnames() {
    let data = fs.readFileSync('workers.txt', 'utf8').toString().split('\n');
    return data;
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
module.exports.create_queue = create_queue;
module.exports.get_blocking_queue = get_blocking_queue;