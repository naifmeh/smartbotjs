const tf = require('@tensorflow/tfjs-node-gpu');
const zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));
    
class Agent {
    constructor(state_size, action_size, num_hidden, actions_index=undefined) {

        this.action_size = action_size;
        console.log('Actions size '+action_size);
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

        model.summary(); 
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

    call_actor(inputs) {
        return this.actor.predict(inputs);
    }

    call_critic(inputs) {
        return this.critic.predict(inputs);
    }

    async reload_weights(path_actor, path_critic) {
        this.actor = await tf.loadModel('file://'+path_actor);
        this.critic = await tf.loadModel('file://'+path_critic)
        await this.critic.compile({
            optimizer: tf.train.adam(5e-4),
            loss: tf.losses.meanSquaredError,
        });
        await this.actor.compile({
            optimizer: tf.train.adam(1e-4),
            loss: tf.losses.softmaxCrossEntropy
        });
        return Promise.resolve();
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
            reward_sum = this.critic.predict(tf.oneHot(this.format_state(next_state), 12).reshape([1, 9, 12]))
                        .flatten().get(0);
        }
    
        let discounted_rewards = [];
        let memory_reward_rev = memory.rewards;
        for(let reward of memory_reward_rev.reverse()) {
            reward_sum = reward + this.discount_factor * reward_sum;
            discounted_rewards.push(reward_sum);
        }
        discounted_rewards = discounted_rewards.reverse();
        let discounted_rewards_tf = tf.tensor(discounted_rewards);
        if(done) {
            for(let i=0; i < memory.actions.length; i++) {
                advantages[i][memory.actions[i]] = discounted_rewards_tf.get(i) - values.get(i, 0);
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
            verbose:0,
        });

        const critic_train = await this.critic.fit(tf_oneHotStates.reshape([memory.actions.length, 9, 12]), tf.tensor(target).reshape([memory.actions.length, 1]), {
             epochs:1,
             verbose:0,
         }); 

        await this.actor.save('file://./local-model-actor');
        await this.critic.save('file://./local-model-critic')
        
        return Promise.resolve(tf.mean(tf.tensor([critic_train.history.loss[0], actor_train.history.loss[0]])).flatten().get(0));
    }


}

module.exports.Agent = Agent;

const environment = require(__dirname+'/../environment')();
const worker_utils = require(__dirname+'/./worker_utils');
const serialiser = require(__dirname+'/../../utils/serialisation');
class MasterAgent {
    constructor(n_workers) {
        this.amt_workers = n_workers;
    }

    async init() {
        this.name = "SmartbotJs-env"; //stylé
        this.env = environment.EnvironmentController(1500);
        await this.env.init_env();

        this.env_data = this.env.getEnvironmentData();

        this.action_size = this.env_data.actions_index.length;
        this.state_size = 9;

        console.log(this.state_size, this.action_size);

        this.agent = new Agent(this.state_size, this.action_size, 24);
        this.agent.actor.save('file://global-model-actor/');
        this.agent.critic.save('file://global-model-critic/');
        return Promise.resolve();
    }

    async train() {
        worker_utils.create_queue();
        let reward_plotting = {};
        let workers = worker_utils.get_workers_hostnames();
        await (async() => {
            const { exec } = require('child_process');
            return new Promise((resolve, reject) => {
                exec(__dirname+'/init_files.sh', (err, stdout, stderr) => {
                    if(err) reject();
                    resolve();
                });
            });   
        })();
        for(let i=0; i<workers.length; i++) {
            console.log("Starting worker "+i);
            worker_utils.start_worker(workers[i]);
        }

        let moving_avg_rewards = [];
        let i=0;
        while(true) {
            let reward = await worker_utils.get_blocking_queue();
            if(reward !== 'done') {
                if(reward !== 'NaN') {
                    console.log('Pulled new data from queue : '+reward);
                    moving_avg_rewards.push(parseFloat(reward));
                    reward_plotting[i] = moving_avg_rewards[i];
                    await serialiser.serialise({
                        reward_plotting: reward_plotting,
                    }, __dirname+'/plot_moving_avg_reward_a3c.json');
                }
            } else {
                break;
            }
            i++;
            
        }
        
        await worker_utils.wait_for_workers();

        return Promise.resolve();
    }
}
module.exports.MasterAgent = MasterAgent;