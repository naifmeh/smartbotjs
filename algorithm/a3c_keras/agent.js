const tf = require('@tensorflow/tfjs-node-gpu');
class Agent {
    constructor(input_dim, output_dim, lr, tau=0.001) {
        this.inp_dim = input_dim;
        this.out_dim = output_dim;
        this.tau = tau;
        this.adam = tf.train.adam(lr);
    }

    fit(inputs, targets) {
        this.model.fit(inputs, targets, {
            epochs: 1,
            batchSize: inputs.shape[0]
        });
    }

    predict(input) {
        this.model.predict(input);
    }
}