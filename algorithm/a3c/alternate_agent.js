const tf = require('@tensorflow/tfjs-node');

class AltAgent {
    constructor(action_size, state_size, num_hidden) {
        this.state_size = state_size;
        this.action_size = action_size;

        let inputs = tf.inputs({shape: [9, 12]});

        this.fc1 = tf.layers.dense({
            units: num_hidden,
            activation: 'relu'
        });

        
        this.policy_logits = tf.layers.dense({
            units: this.action_size,
        });

        this.policy_logits_model = tf.model({inputs: inputs, outputs: this.policy_logits.apply(this.fc1.apply(inputs))});

        this.fc2 = tf.layers.dense({
            units: num_hidden,
            activation: 'relu',
        });

        this.values = tf.layers.dense({
            units: 1,
        });

        this.values_model = tf.model({inputs: inputs, outputs: this.values.apply(this.fc2.apply(inputs))});
        
    }

    call(inputs, batchsize) {
        let values = this.values_model.predict(inputs, {
            batchSize: batchsize,
        });

        let policy = this.policy_logits_model.predict(inputs, {
            batchSize: batchsize,
        });

        return { 'logits': policy, 'values': values};
    }

    record(ep, ep_reward, worker_idx, glob_ep_reward, res_queue, total_loss, num_steps) {

    }
}

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

        this.global_model = new AlternateAgent(this.state_size, this.action_size, 24);
        
        this.amt_workers = n_workers;
    }

    train() {

        let workers = [];
        for(let i=0; i<this.amt_workers; i++) {
            //TODO: create workers
        }

    }
}