function actor_critic() {
    const tf = require('@tensorflow/tfjs-node-gpu');
    
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
                inputDim:this.state_size,
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
            }).flatten();
            
            return math_utils.weightedRandomItem(actions, policy);
        }

        train_model(state, action, reward, next_state, done) {
            
        }
    }

    

    let A2c = new A2CAgent(100000, 20);
}

actor_critic();