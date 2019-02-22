const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit:'20mb', extended: true}));


app.post('/global_moving_average', (req, res, next) => {
    console.log('Updating global moving average');
    let avg = req.body.data;
    
    fs.writeFileSync('global_moving_average.txt', avg);
    res.send({status: 'SUCCESS'});
});

app.get('/global_moving_average', (req, res, next) => {
    console.log('Get global moving average');
    let data = fs.readFileSync('global_moving_average.txt', 'utf8');
    
    res.send({status: 'SUCCESS', data: data});
});

app.post('/best_score', (req, res, next) => {
    console.log('Updating best_score');
    let avg = req.body.data;
    
    fs.writeFileSync('best_score.txt', avg);
    res.send({status: 'SUCCESS'});
});

app.get('/best_score', (req, res, next) => {
    console.log('Get best_score');
    let data = fs.readFileSync('best_score.txt', 'utf8');
    
    res.send({status: 'SUCCESS', data: data});
});

app.get('/create_queue', (req, res, next) => {
    fs.closeSync(fs.openSync('queue.txt', 'w'));
    res.send({status: 'SUCCESS'});
});

app.post('/queue', (req, res, next) => {
    console.log('Adding to queue');
    let elem = req.body.data;
    fs.appendFileSync('queue.txt', elem.toString()+'\n');

    res.send({status: 'SUCCESS'});
});

app.get('/queue', (req, res, next) => {
    let data = fs.readFileSync('queue.txt', 'utf8').toString().split('\n');
    if(data.length === 1 && data[0] === '') {
        res.send({status: 'FAIL', data: "NaN", err: 'No data in queue'});
    }
    let elem_pop = data[0];
    let str = '';
    for(let i=1;i <data.length;i++) {
        str += data[i] + '\n';
    }

    fs.writeFileSync('queue.txt', str);

    res.send({status: 'SUCCESS', data: elem_pop});
});

app.post('/local_model_weights', (req, res, next) => {
    console.log('Saving local model into global model...');
    let data_actor = req.body.data_actor;
    let data_critic = req.body.data_critic;
    let temporary = req.body.temporary;
    if(temporary) {
        fs.writeFileSync(__dirname+'/temporary-global-model-actor/weights.bin', data_actor, 'binary');
        fs.writeFileSync(__dirname+'/temporary-global-model-critic/weights.bin', data_critic, 'binary');
    } else {
        fs.writeFileSync(__dirname+'/global-model-actor/weights.bin', data_actor, 'binary');
        fs.writeFileSync(__dirname+'/global-model-critic/weights.bin', data_critic, 'binary'); 
    }
    res.send({status: 'SUCCESS'});
});

app.get('/global_model_weights_actor', (req, res, next) => {
    console.log('Get global model weights (actor)');
    
    res.sendFile(__dirname+'/global-model-actor/weights.bin')
});

app.get('/global_model_weights_critic', (req, res, next) => {
    res.sendFile(__dirname+'/global-model-critic/weights.bin');
});

app.post('/global_episode', (req, res, next) => {
    console.log('Updating global moving average');
    let data = parseInt(fs.readFileSync('global_episode.txt', 'utf8'));
    data += 1;
    fs.writeFileSync('global_episode.txt', data);
    res.send({status: 'SUCCESS'});
});

app.get('/global_episode', (req, res, next) => {
    console.log('Get global moving average');
    let data = fs.readFileSync('global_episode.txt', 'utf8');
    
    res.send({status: 'SUCCESS', data: data});
});

app.get('/worker_done', (req, res, next) => {
    console.log('Poping token from workers list');
    let data = fs.readFileSync('workers_tokens.txt', 'utf8').toString().split('\n');
    if(data.length === 1 && data[0] === '') {
        res.send({status: 'FAIL', data: "NaN", err: 'No data in queue'});
    }
    let elem_pop = data[0];
    let str = '';
    for(let i=1;i <data.length;i++) {
        str += data[i] + '\n';
    }

    fs.writeFileSync('queue.txt', str);

    res.send({status: 'SUCCESS', data: elem_pop});
});

app.get('/workers_status', (res, req, next) => {
    console.log('Checking workers status');
    let workers = fs.readFileSync('workers_tokens.txt', 'utf8').toString().split('\n');
    if(workers.length === 1 && workers[0] === '')
        res.send({status: 'SUCCESS', data: 'done'});
    else
        res.send({status: 'SUCCESS', data: workers.length});
});

app.get('/worker_started', (req, res, next) => {
    console.log('Appending token to workers list');
    fs.appendFileSync('workers_tokens.txt','1\n');

    res.send({status: 'SUCCESS'});
});

const server = app.listen(33333, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Listening on port 33333...");
});