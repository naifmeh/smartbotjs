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

worker_utils.set_global_episode(0);
worker_utils.set_global_moving_average(0);
worker_utils.set_best_score(0);


const environment = require('../environment.js')();

class Worker {
    static Agent = require('./agent.js').Agent;
    constructor(state_size, action_size, global_model, opti, res_queue, idx) {
        this.state_size = state_size;
        this.action_size = action_size;
        this.result_queue = res_queue;
        this.global_model = global_model;
        this.opti = opti

        this.agent = new Agent(this.state_size, this.action_size);

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

        for(let i = 0; i < Object.values(data.websites).length; i++) {
            let current_state = this.env.reset(i);
            mem.clear();
            let ep_reward = 0.0;
            let ep_steps = 0;
            let step_count = 0;
            this.ep_loss = 0;

            let time_count = 0;
            let done = False;
            while(true) {
                let policy = this.agent.call_actor(tf.oneHot(current_state, 12).reshape([1, 9, 12]), 1);
                
                let action = math_utils.weightedRandomItem(probs.dataSync(), policy);

                let step_data = this.env.step(action);
                let next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;
                
                ep_reward += reward;

                mem.store(current_state, action, reward);

                if(time_count%this.update_freq === 0 || done) {
                    //train local network
                    let ep_mean_loss = await this.agent.train_model(done, mem, next_state);
                    await worker_utils.send_model(this.worker_idx);
                    // Updating local model with new weights
                    await worker_utils.get_global_model();
                    this.ep_loss += ep_mean_loss;
                    mem.clear();
                    time_count = 0;
                    //TODO : Maybe we shouldn't write the weights yet, and just store them ?
                }
                
                if(done) {
                    await worker_utils.set_global_moving_average(record());//TODO: data here))
                    if( ep_reward > (await worker_utils.get_best_score())) {
                        await worker_utils.save_global_model();
                    }
                    await worker_utils.set_best_score(ep_reward);
                    await worker_utils.increment_global_episode();
                    break;
                }
            }
            ep_steps++;
            time_count++;
            current_state = next_state;
            total_step++;   
        }

        await worker_utils.write_queue('done');
    }

}