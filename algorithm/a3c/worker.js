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
    static Agent = require('./alternate_agent.js').Agent;
    constructor(state_size, action_size, global_model, opti, res_queue, idx) {
        this.state_size = state_size;
        this.action_size = action_size;
        this.result_queue = res_queue;
        this.global_model = global_model;
        this.opti = opti

        this.local_model = new Agent(this.state_size, this.action_size);

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
                let logits = this.local_model.call(tf.oneHot(current_state, 12).reshape([1, 9, 12]))[0];
                
                let probs = tf.layers.softmax(logits);
                let action = math_utils.weightedRandomItem(probs.dataSync(), policy_flat);

                let step_data = this.env.step(action);
                let next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;

                mem.store(current_state, action, reward);

                if(time_count%this.update_freq === 0 || done) {
                    let total_loss = compute_loss(done, next_state, mem);

                    ep_loss += total_loss;
                    //TODO : compute gradient dL/dW (LOOK MORE ON THE MATTER)
                    //TODO: Apply gradient to global model using optimizer
                    //Here we could use a worker function to send back a serializable
                    //version of our gradient and apply it to the global net there
                    // TFJS says everything should be serialisable so lets see

                    //TODO: Get back global weights and apply them to local net

                    mem.clear();
                    time_count = 0;
                }
                
                if(done) {
                    worker_utils.set_global_moving_average(record());//TODO: data here))
                    if( ep_reward > worker_utils.get_best_score()) {
                        worker_utils.save_global_model();
                    }
                    worker_utils.set_best_score(ep_reward);
                    break;
                }
            }
            ep_steps++;
            time_count++;
            current_state = next_state;
            total_step++;   
        }

        worker_utils.update_queue(res_queue, 'done');
    }

    compute_loss(done, new_state, memory, gamma=0.99) {
        let reward_sum;
        if(done) {
            reward_sum = 0.0;
        } else {
            reward_sum = this.local_model.get_value(new_state);
        }

        let discounted_rewards = [];
        let mem_rew_copy = memory.rewards.copy();
        for(let i=0; i<mem_rew_copy.reverse(); i++) {
            reward_sum = reward + gamma * reward_sum;
            discounted_rewards.push(reward_sum);
        }
        discounted_rewards.reverse();

        let action_values = this.local_model.get_actions_values(memory.states);
        let logits = action_values.policies, //batches
            values = action_values.values;

        let advantages = [];
        let value_loss = [];
        for(let i=0; i< Math.min(values.shape[0], logits.length); i++) {
            advantages.push(discounted_rewards[i] - values.get(i).flatten().get(0));
            value_loss.push(advantages[i] ** 2);
        }

        let actions_onehot = [];
        for(let i=0; i < memory.actions.length; i++) {
            actions_onehot.push(tf.oneHot(memory.actions[i], this.action_size));
        }
        actions_onehot = tf.tensor(actions_onehot, dtype='float32');
        let entropy = tf.sum(logits.mul(tf.log(tf.add(logits + 1e-20))), axis=1)

        let policy_loss = tf.losses.softmaxCrossEntropy(actions_onehot, logits);

        policy_loss.add(entropy.mul(-0.01));
        value_loss_tensor = tf.tensor(value_loss, dtype='float32');

        let total_loss = tf.mean(policy_loss.add(value_loss_tensor.mul(0.5)))

        console.log("Total loss {"+total_loss+"}")
        return {'policy_loss': policy_loss, 'value_loss': value_loss, 'total_loss':total_loss};
        
        
    }
}