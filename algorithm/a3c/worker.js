
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

var global_episode = 0;
const environment = require('../environment.js')();

class Worker {
    static Agent = require('./agent.js').Agent;
    constructor(state_size, action_size, global_model, opti, res_queue, idx) {
        this.state_size = state_size;
        this.action_size = action_size;
        this.result_queue = res_queue;
        this.global_model = global_model;
        this.opti = opti;

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
        this.local_model.set_actions(data.actions_index);

        for(let i = 0; i < Object.values(data.websites).length; i++) {
            let current_state = this.env.reset(i);
            let ep_reward = 0.0;
            let ep_steps = 0;
            let step_count = 0;
            this.ep_loss = 0;

            let time_count = 0;
            let done = False;
            while(true) {
                let action = this.local_model.get_action(current_state, data.actions_index);
                let step_data = await environment.step(action);
                let next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;
                
                reward = tf.clipByValue(reward, -1, 1).flatten().get(0);
                ep_reward += reward;
                mem.store(current_state, action, reward);


                if(i%this.update_freq || done) {
                    //TODO: Update global net
                    let total_loss = compute_loss(done, new_state, mem);
                    this.ep_loss += total_loss;
                    let grads;
                }

                if(done) break;
                
                current_state = next_state;
                step_count++;
            }

            
        }
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

        return total_loss;
        

        
        
        
    }
}