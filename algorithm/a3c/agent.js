const tf = require('@tensorflow/tfjs-node');
class Agent {
    

    constructor(state_size, action_size, actions) {
        this.render = false;
        this.state_size = state_size;
        this.action_size = action_size;
        this.value_size = 1;

        this.discount_factor = 0.99;
        this.actor_learningr = 0.001;
        this.critic_learningr = 0.005;

        this.actor = build_actor();
        this.critic = build_critic();
        if(actions)
            this.actions = actions;
    }

    set_actions(actions) {
        this.actions = actions;
    }

    build_actor() {
        const model = tf.sequential();
        
        model.add(tf.layers.dense({
            units: 24,
            activation: 'relu',
            kernelInitializer:'glorotUniform',
            inputShape:[9, 12], //oneHotShape
        }));
        
        model.add(tf.layers.flatten());

        model.add(tf.layers.dense({
            units: this.action_size,
            activation:'softmax',
            kernelInitializer:'glorotUniform',
        }));

        model.summary();

        model.compile({
            optimizer: tf.train.adam(this.actor_learningr),
            loss:tf.losses.softmaxCrossEntropy
        });

        return model;
    }

    build_critic() {
        const model = tf.sequential();
        
        
        model.add(tf.layers.dense({
            units: 24,
            activation: 'relu',
            kernelInitializer:'glorotUniform',
            inputShape: [9, 12], //oneHot shape
        }));

        model.add(tf.layers.flatten());

        model.add(tf.layers.dense({
            units: this.value_size,
            activation:'linear',
            kernelInitializer:'glorotUniform',
        }));

        model.summary();

        model.compile({
            optimizer: tf.train.adam(this.critic_learningr),
            loss:tf.losses.meanSquaredError,
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

    get_action(state, actions) {
        const math_utils = require('../utils/math_utils');
        
        let oneHotState = tf.oneHot(this.format_state(state), 12);
        
        let policy = this.actor.predict(oneHotState.reshape([1,9,12]), {
            batchSize:1,
        });
        
        let policy_flat = policy.dataSync();
        
        return math_utils.weightedRandomItem(actions, policy_flat)
    }

    get_value(state) {
        const math_utils = require('../utils/math_utils');
        
        let oneHotState = tf.oneHot(this.format_state(state), 12);
        

        let value = this.critic.predict(oneHotState.reshape([1, 9, 12]), {
            batchSize: 1,
        });
        
        return value.flatten().get(0);
    }

    get_actions_values(states) {
        const math_utils = require('../utils/math_utils');
        let policies = [];
        let values = [];

        let oneHotState = tf.oneHot(this.format_state(states), 12);
            
        let policy = this.actor.predict(oneHotState.reshape([states.length,9,12]), {
            batchSize:states.length,
        });

        let value = this.critic.predict(oneHotState.reshape([states.length, 9, 12]), {
            batchSize: states.length,
        });
            
        

        return { 'policies' : policy, 'values': value};
    }

    

    train_model(state, action, reward, next_state, done) {
        let target = zeros(1, this.value_size);
        let advantages = zeros(1, this.action_size);

        let oneHotState = tf.oneHot(this.format_state(state), 12);
        let oneHotNextState = tf.oneHot(this.format_state(next_state), 12);
        oneHotState = oneHotState.reshape([1, 9, 12])
        oneHotNextState = oneHotNextState.reshape([1, 9, 12])
        let value = this.critic.predict(oneHotState).flatten().get(0);
        let next_value = this.critic.predict(oneHotNextState).flatten().get(0);
        console.log(action) //Pb nbr d'actions dans advantages
        if(done) {
            advantages[action] = [reward - value];
            target[0] = reward;
        } else {
            advantages[action] =  [reward +this.discount_factor * (next_value) - value];
            target[0] = reward + this.discount_factor * next_value;
        }

        
        this.actor.fit(oneHotState, tf.tensor(advantages).reshape([1,2047]), {
            epochs:1,
        });

        this.critic.fit(oneHotState, tf.tensor(target), {
            epochs:1,
        });
        
    }
}

module.exports.Agent = Agent;

const environment = require('../environment')();
class MasterAgent {
    async constructor(n_workers) {
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

    train() {

        let workers = [];
        for(let i=0; i<this.amt_workers; i++) {
            //TODO: create workers
        }

    }
}