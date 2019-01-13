function actor_critic() {
    const tf = require('@tensorflow/tfjs');

    class PolicyEstimator {
        constructor(nStates, nActions, learning_rate=0.01, scope="policy_estimator") {
            try {
                this._state = tf.input({dtype:'int32', shape:[], name:"state"});
                this._action = tf.input({dtype:'int32', name:"action"});
                this._target = tf.input({dtype:'float32', name:"target"});

                let state_one_hot = tf.oneHot(this._state, nStates);
                this._output_layer = tf.layers.dense({
                    inputDim:tf.expandDims(state_one_hot, 0),
                    kernelInitializer: tf.initializers.zeros(),
                    units: nActions,
                });

                this._action_probs = tf.squeeze(tf.softmax(this._output_layer));
                this._picked_action_prob = tf.gather(this._action_probs, this._action);

                this._loss = this._target.mul(-1*this._picked_action_prob);

                this._optimizer = tf.train.adam(learning_rate);
                this._train_op = this._optimizer.minimize(this._loss) //cannot get the global step

            } catch(err) {
                console.err(err);
            }

        }

        predict(state, sess=null) {
            // Sessions in TSF JS ?
        }

        update(state, target, action, sess=null) {
            let feed_obj = {};
            feed_obj[this._state] = state;
            feed_obj[this._target] = target;
            feed_obj[this._action] = action;

            //sessions again


        }
    }
}