class Memory{
    constructor() {
        this.states = [];
        this.actions = [];
        this.rewards = [];
    }

    store(state, action, reward) {
        this.states.push(state);
        this.actions.push(action);
        this.rewards.push(reward);
    }

    clear() {
        this.states = [];
        this.actions = [];
        this.rewards = [];
    }
}


const worker_utils = require('./worker_utils');
const tf = require('@tensorflow/tfjs-node-gpu');
const math_utils = require('../../utils/math_utils');

async function record(episode, reward, idx, glob_ep_rew, total_loss, num_steps) {
    let global_ep_reward = glob_ep_rew
    if(global_ep_reward == 0) {
        global_ep_reward = reward
    } else {
        global_ep_reward = global_ep_reward * 0.99 + reward*0.01;
    }
    console.log('Episode :'+episode);
    console.log('Moving average reward : '+global_ep_reward);
    console.log('Episode reward : '+reward);
    console.log('Loss: '+(num_steps == 0 ? total_loss : Math.ceil(total_loss/num_steps*1000)/1000));
    console.log("Steps : "+num_steps);  
    console.log("Worker :"+idx);

    await worker_utils.write_queue(global_ep_reward);
    return Promise.resolve(global_ep_reward);
}

const environment = require('../environment.js')();
const Agent = require('./agent.js').Agent;
class Worker {
    
    constructor(idx) {
        
        this.worker_idx = idx;
        this.ep_loss = 0.0;
        
        this.env = environment.EnvironmentController(1500);

        this.update_freq = 10;
    }

    async run() { //Analogy to the run function of threads
        let total_step = 1;
        let mem = new Memory();
        await this.env.init_env();

        let data = this.env.getEnvironmentData();
        this.state_size = 9;
        this.action_size = data.actions_index.length;

        this.agent = new Agent(this.state_size, this.action_size, 24);

        for(let i = 0; i < Object.values(data.websites).length; i++) {
            let current_state = this.env.reset(i);
            mem.clear();
            let ep_reward = 0.0;
            let ep_steps = 0;
            let step_count = 0;
            this.ep_loss = 0;

            let time_count = 0;
            while(true) {
                data = this.env.getEnvironmentData();
                console.log('Episode '+i+' : '+(data.current_step+1)+'/'+(data.length_episode+1));
                let policy = this.agent.call_actor(tf.oneHot(this.agent.format_state(current_state), 12).reshape([1, 9, 12]));
                
                let action = math_utils.weightedRandomItem( data.actions_index, policy.dataSync());

                let step_data = await this.env.step(action);
                console.log('-------------');
                var next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;
                
                ep_reward += reward;

                mem.store(current_state, action, reward);
                if(time_count === this.update_freq || done) {
                    //train local network
                    let ep_mean_loss = await this.agent.train_model(done, mem, next_state);
                    
                    await worker_utils.send_model(this.worker_idx, true);
                    // Updating local model with new weights
                     //NESCESSARY ?
                    //await this.agent.reload_weights(__dirname+'/')
                    this.ep_loss += ep_mean_loss;
                    console.log(this.ep_loss);
                    mem.clear();
                    time_count = 0;
                    //TODO : Maybe we shouldn't write the weights yet, and just store them ?
                }
                
                if(done) {
                    let global_epi = await worker_utils.get_global_episode();
                    let old_glob_moving_avg = await worker_utils.get_global_moving_average();
                    
                    let glob_moving_avg = await record(global_epi, ep_reward, this.worker_idx,
                        old_glob_moving_avg, this.ep_loss, ep_steps);
                    
                    await worker_utils.set_global_moving_average(glob_moving_avg);
                    
                    let global_best_score = await worker_utils.get_best_score();
                    console.log('Episode reward : '+ep_reward)
                    console.log('Global best score '+global_best_score);
                    if( ep_reward > global_best_score) {
                        console.log('Updating global model');
                        await worker_utils.send_model(this.worker_idx, false);
                        await worker_utils.get_global_model_actor();
                        await worker_utils.get_global_model_critic();
                        await this.agent.reload_weights(__dirname+'/local-model-actor/model.json',__dirname+'/local-model-critic/model.json');
                        await worker_utils.set_best_score(ep_reward);
                    }
                    await worker_utils.increment_global_episode();
                    break;
                }
                ep_steps++;
                time_count++;
                current_state = next_state;
                total_step++;   
                console.log('----------------- END OF TRAINING DATA');
            }
            
        }

        await worker_utils.write_queue('done');
        await worker_utils.notify_worker_done();
        return Promise.resolve();
    }

}

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit:'10mb', extended: true}));

app.get('/start_worker', (req, res, next) => {
    let worker = new Worker(1);
    (async() => {
        await worker_utils.add_worker_token(1);
        await worker.run();
    })();
    res.send({status: 'SUCCESS'});
});

const server = app.listen(8085, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Listening on port 8085...");
});