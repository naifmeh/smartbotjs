const tf = require('@tensorflow/tfjs-node-gpu');

class Agent {
    constructor(action_size, state_size, num_hidden, actions_index=undefined) {
        let optimizer = tf.train.adam(1e-4);

        this.action_size = action_size;
        this.state_size = state_size;

        if(actions_index) this.actions_index = actions_index;

        this.model = build_model();
    }

    build_model() {

        const input = tf.layers.input({shape: [9, 12]}); //oneHot state shape

        const fc1 = tf.layers.dense({
            units: num_hidden,
            name: 'dense1',
            activation: 'relu',
        });

        const policy_output = tf.layers.dense({
            units: this.action_size,
            name:'policy'
        });

        const fc2 = tf.layers.dense({
            units: num_hidden,
            name: 'dense2',
            activation: 'relu',
        });

        const value_output = tf.layers.dense({
            units: 1,
            name: 'value'
        });

        const output1 = policy_output.apply(fc1.apply(input));
        const output2 = value_output.apply(fc2.apply(input));

        const model = tf.model({inputs:input, outputs: [output1, output2]});

        return model;
    }

     call(input) {
         const result = this.model.predict(input);
         return {'logits': result[0], 'values': result[1]};
     }

     get_trainable_weights() {
         return this.model.getWeights();
     }


}

function record(episode, ep_reward, worker_id, global_ep_reward, res_queue, 
    total_loss, num_steps) {
        if(global_ep_reward === 0) {
            global_ep_reward = ep_reward;
        } else {
            global_ep_reward = global_ep_reward * 0.99 + ep_reward * 0.01;
        }

        console.log() //TODO: print log

        res_queue.put(global_ep_reward);

        return global_ep_reward;
}

module.exports.Agent = Agent;

const environment = require('../environment')();
const queue = require('./queue');
const worker_utils = require('./worker_utils');

class MasterAgent {
    constructor(n_workers) {
        
    }

    init(n_workers) {
        this.name = "SmartbotJs-env"; //stylé
        this.env = environment.EnvironmentController(1500);
        await this.env.init_env();

        this.env_data = this.env.getEnvironmentData();

        this.action_size = this.env_data.actions_index.length;
        this.state_size = 12;

        this.lr = 0.0001;

        this.opti = tf.train.Optimizer(tf.train.adam(this.lr));
        console.log(this.state_size, this.action_size);

        this.global_model = new Agent(this.state_size, this.action_size, 24, this.env_data.actions_index);
        
        this.amt_workers = n_workers;
    }

    train() {
        let res_queue = new queue('result');
        let workers = worker_utils.get_worker(); //array with workers IP
        for(let i=0; i< workers.length; i++) {
            console.log('Starting worker '+i);
            worker_utils.send_start(i);
        }

        let moving_average_rewards = [];

        while(true) {
            let reward = res_queue.get();
            if(reward !== null) {
                moving_average_rewards.push(reward);
            } else {
                break;
            }
        }

        worker_utils.wait_for_workers();
    }
}