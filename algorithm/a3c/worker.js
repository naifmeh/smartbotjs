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
                let logits = this.local_model.call(tf.oneHot(current_state, 12).reshape([1, 9, 12])).logits;
                
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
        let reward_sum = 0.;
        if(done) {
            reward_sum = 0.;
        } else {
            reward_sum = this.local_model.call(tf.oneHot(new_state).reshape([1, 9, 12]))
                        .values.flatten().get(0);
        }

        let discounted_rewards = [];
        let memory_reward_rev = memory.rewards;
        for(let reward in memory_reward_rev.reverse()) {
            reward_sum = reward + gamma * reward_sum;
            discounted_rewards.append(reward_sum);
        }
        discounted_rewards.reverse();

        let onehot_states = [];
        for(let state of memory.states) {
            onehot_states.push(tf.oneHot(state, 12));
        }
        let init_onehot = onehot_states[0];
        for(let i=1; i<init_onehot.length;i++) {
            init_onehot.concat(onehot_states[i]);
        }

        let log_val = this.local_model.call(
            init_onehot.reshape([memory.states.length, 9, 12])
        );

        let advantage = tf.tensor(discounted_rewards).sub(log_val.values);
        let value_loss = advantage.square();

        let policy = tf.layers.softmax(log_val.logits);
        let logits_cpy = log_val.values.copy();

        let entropy = tf.sum(policy.mul(logits_cpy.mul(tf.scalar(-1)))); 
        let policy_loss = tf.losses.softmaxCrossEntropy(memory.actions, log_val.logits);
        
        
        let value_loss_copy = value_loss.copy();
        let entropy_mul = (entropy.mul(tf.scalar(0.01))).mul(tf.scalar(-1));
        let total_loss_1 = value_loss_copy.mul(tf.scalar(0.5, dtype='float32')),
            total_loss_2 = total_loss_1.sum(policy_loss),
            total_loss = total_loss_2.sum(entropy_mul);

        return total_loss;
        
    }
}