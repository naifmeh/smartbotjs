const tf = require('@tensorflow/tfjs-node');
const zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));
    
class Agent {
    constructor(action_size, state_size, num_hidden, actions_index=undefined) {
        let optimizer = tf.train.adam(1e-4);

        this.action_size = action_size;
		this.state_size = state_size;
        this.num_hidden = num_hidden;
        this.discount_factor = 0.999;

        if(actions_index) this.actions_index = actions_index;

        this.actor = this.build_actor();
        this.critic = this.build_critic();
    }

    build_actor() {
        const model = tf.sequential();
        

        model.add(tf.layers.dense({
            inputShape: [9, 12],
            units: this.num_hidden,
            activation: 'relu',
            kernelInitializer:'glorotUniform',
            
        }));

        model.add(tf.layers.flatten());

        model.add(tf.layers.dense({
            units: this.action_size,
            activation: 'softmax',
            kernelInitializer:'glorotUniform',
            
        }));

        model.summary();

        model.compile({
            optimizer: tf.train.adam(1e-4),
            loss: tf.losses.softmaxCrossEntropy
        });

        return model;
    }

    build_critic() {
        let model = tf.sequential();

        model.add(tf.layers.dense({
            inputShape: [9, 12],
            kernelInitializer:'glorotUniform',
            activation: 'relu',
            units: this.num_hidden,
        }));

        model.add(tf.layers.flatten());

        model.add(tf.layers.dense({
            kernelInitializer:'glorotUniform',
            activation: 'softmax',
            units: 1,
        }));

        model.compile({
            optimizer: tf.train.adam(5e-4),
            loss: tf.losses.meanSquaredError
        });

        return model;
    }

    format_state(state) {
        let copy_state = state.slice();
        for(let i=0; i < state.length; i++) {
            if(Array.isArray(copy_state[i])) {
                copy_state[i] = Math.ceil(state[i][1] / 10);
            }
        }
        return copy_state;
    }

    call_actor(inputs, batchSize) {
        this.actor.predict(inputs, {
            batchSize: batchSize
        });
    }

    call_critic(inputs, batchSize) {
        this.critic.predict(inputs, {
            batchSize: batchSize,
        });
    }

    async train_model(done, memory, next_state) {
        let target = zeros(this.value_size, memory.actions.length );
        let advantages = zeros(this.action_size, memory.actions.length);

        let tf_oneHotStates;
        for(let i=0; i< memory.states.length; i++) {
            if(i===0) tf_oneHotStates = tf.oneHot(this.format_state(memory.states[i]), 12);
            else tf_oneHotStates = tf_oneHotStates.concat(tf.oneHot(this.format_state(memory.states[i]), 12))
        }
        
        let oneHotNextState = tf.oneHot(this.format_state(next_state), 12);
        oneHotNextState = oneHotNextState.reshape([1, 9, 12])
        let values = this.critic.predict(tf_oneHotStates.reshape([memory.states.length, 9, 12])).reshape([memory.states.length, 1]);
        let next_value = this.critic.predict(oneHotNextState).reshape([1]);
        let reward_sum = 0.;
        if(!done) {
            reward_sum = this.critic.predict(tf.oneHot(next_state, 12).reshape([1, 9, 12]))
                        .flatten().get(0);
        }
    
        let discounted_rewards = [];
        let memory_reward_rev = memory.rewards;
        for(let reward of memory_reward_rev.reverse()) {
            reward_sum = reward + this.discount_factor * reward_sum;
            discounted_rewards.push(reward_sum);
        }
        let discounted_rewards_tf = tf.tensor(discounted_rewards);
        if(done) {
            for(let i=0; i < memory.actions.length; i++) {
                advantages[i][memory.actions[i]] = discounted_rewards.get(i) - values.get(i, 0);
                target[i][0] = discounted_rewards[i];
            }
        } else {
            for(let i=0; i < memory.actions.length; i++) {
                advantages[i][memory.actions[i]] = next_value.flatten().get(0)*this.discount_factor + discounted_rewards_tf.get(i) - values.get(i, 0);
                target[i][0] = next_value.flatten().get(0) * this.discount_factor + discounted_rewards_tf.get(i);
            }
        }

        
        const actor_train = await this.actor.fit(tf_oneHotStates.reshape([memory.actions.length, 9, 12]), tf.tensor(advantages).reshape([memory.actions.length, this.action_size]), {
            epochs:1,
        });

        const critic_train = await this.critic.fit(tf_oneHotStates.reshape([memory.actions.length, 9, 12]), tf.tensor(target).reshape([memory.actions.length, 1]), {
             epochs:1,
         }); 

        this.actor.save('file://./local-model-actor');
        this.critic.save('file://./local-model-critic')
        
        return
    }


}

module.exports.Agent = Agent;

const environment = require('../environment')();
const worker_utils = require('./worker_utils');
class MasterAgent {
    constructor(n_workers) {
        this.name = "SmartbotJs-env"; //stylé
        this.env = environment.EnvironmentController(1500);
        await this.env.init_env();

        this.env_data = this.env.getEnvironmentData();

        this.action_size = this.env_data.actions_index.length;
        this.state_size = 12;

        this.lr = 0.0001;

        this.opti = tf.train.Optimizer(tf.train.adam(this.lr));
        console.log(this.state_size, this.action_size);

        this.global_model = new Agent(this.state_size, this.action_size, this.env_data.actions_index);
        
        this.amt_workers = n_workers;
    }

    async train() {
        worker_utils.create_queue();

        let workers = [];
        for(let i=0; i<this.amt_workers; i++) {
            worker_utils.start_worker(i);
        }

        let moving_avg_rewards = [];
        while(true) {
            let reward = await worker_utils.get_queue();
            if(reward !== 'done') {
                moving_avg_rewards.push(reward);
            } else {
                break;
            }
        }
        await worker_utils.wait_for_workers();
    }
}