function actor_critic() {
    const tf = require('@tensorflow/tfjs-node-gpu');
    let zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));
    
    class A2CAgent {
        constructor(state_size, action_size) {
            this.render = false;
            this.state_size = state_size;
            this.action_size = action_size;
            this.value_size = 1;

            this.discount_factor = 0.99;
            this.actor_learningr = 0.001;
            this.critic_learningr = 0.005;

            this.actor = this.build_actor();
            this.critic = this.build_critic();
        
        }

        build_actor() {
            const model = tf.sequential();

            this.state = tf.input({name:"state", dtype:'int32', shape:[]});
            let one_hot = tf.oneHot(this.state, this.state_size); //Pb ne prend pas de placeholder
            model.add(tf.layers.dense({
                units: 24,
                activation: 'relu',
                kernelInitializer:'glorotUniform',
                inputDim:tf.expandDims(one_hot, 0),
            }));

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

            this.state = tf.input({name:"state", dtype:'int32', shape:[]});
            let one_hot = tf.oneHot(this.state, this.state_size)
            
            model.add(tf.layers.dense({
                units: 24,
                activation: 'relu',
                kernelInitializer:'glorotUniform',
                inputDim:this.state_size,
            }));

            model.add(tf.layers.dense({
                units: this.action_size,
                activation:'softmax',
                kernelInitializer:'glorotUniform',
            }));

            model.summary();

            model.compile({
                optimizer: tf.train.adam(this.critic_learningr),
                loss:tf.losses.meanSquaredError,
            });

            return model;
        }

        get_action(state, actions) {
            const math_utils = require('../utils/math_utils');
            let policy = this.actor.predict(state, {
                batchSize:1,
            })[0].flatten();
            
            return math_utils.weightedRandomItem(actions, policy);
        }

        train_model(state, action, reward, next_state, done) {
            let target = zeros(1, this.value_size);
            let advantages = zeros(1, this.action_size);

            let value = this.critic.predict(state)[0];
            let next_value = this.critic.predict(next_state)[0];

            if(done) {
                advantages[0][action] = reward - value;
                target[0][0] = reward;
            } else {
                advantages[0][action] = reward +this.discount_factor * (next_value) - value;
                target[0][0] = reward + this.discount_factor * next_value;
            }

            this.actor.fit(state, advantages, {
                epochs:1,
            });
            this.critic.fit(state, target, {
                epochs:1,
            });
            
        }
    }

    
    const environment = require('./environment')().EnvironmentController(1500);


    async function main(offline=false) {
        let episode_done = false;
        if(!offline)
            await environment.init_env();

        let data = environment.getEnvironmentData();
        const AMOUNT_ACTIONS = data.actions_index.length;
        const STATE_SIZE = data.states.length;

        let agent = new A2CAgent(STATE_SIZE, AMOUNT_ACTIONS);
        let reward_plotting = {};
        let episode_length = 0;
        for(let i = 0; i < Object.values(data.websites).length; i++) {
            episode_done = false;
            reward_plotting[i] = 0;

            let state = environment.reset(i);
            
            
            while(true) {
                data = environment.getEnvironmentData();
                console.log('Episode '+i+' : '+(data.current_step+1)+'/'+(data.length_episode+1));
            
                let action = agent.get_action(state);
                let step_data = await environment.step(action);
                let next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;
                
                episode_length = step_data.episode_length;

                reward_plotting[i] += reward < 0 ? 1: 0;
                agent.train_model(state, action, reward, next_state, done);

                if(done) {
                    break;
                }

                state = next_state;
            }
            reward_plotting[i] = (reward_plotting[i]/(episode_length+1))*100;
            if(i%10) {
                agent.actor.save('localstorage://'+__dirname+'/actor_model');
                agent.critic.save('localstorage://'+__dirname+'/critic_model');
            }
        }

        return Promise.resolve({
            reward_plotting: reward_plotting,
        })
    }

    let A2C = new A2CAgent(1000,1000);

    return {
        main: main,
    }
}

module.exports = new actor_critic();
let sars = new actor_critic();

    

    


