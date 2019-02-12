function actor_critic() {
    const tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-node-gpu');
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
            
            return math_utils.weightedRandomItem(actions, policy_flat);
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

    
    const environment = require('./environment')().EnvironmentController(1500);
    const serialiser = require('../utils/serialisation');


    async function main(offline=false) {
        let episode_done = false;
        if(!offline)
            await environment.init_env();

        let data = environment.getEnvironmentData();
        const AMOUNT_ACTIONS = data.actions_index.length;
        const STATE_SIZE = 12;

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

                let action = agent.get_action(state, data.actions_index);
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
            await serialiser.serialise({
                reward_plotting: reward_plotting,
            }, 'plot_actor_critic.json');
             if(i%10) {
                 agent.actor.save('file://./actor_model');
                 agent.critic.save('file://./critic_model');
             }
        }

        return Promise.resolve({
            reward_plotting: reward_plotting,
        });
    }

    return {
        main: main,
    }
}

//module.exports = new actor_critic();
(async() => {
    let sars = new actor_critic();
    sars.main();
})();


    

    


