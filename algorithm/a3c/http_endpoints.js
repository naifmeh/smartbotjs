const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit:'10mb', extended: true}));

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
})

const server = app.listen(33333, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Listening on port 33333...");
});