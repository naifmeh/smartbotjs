const tf = require('@tensorflow/tfjs-node-gpu');

class Agent {
    constructor(action_size, state_size, num_hidden, actions_index=undefined) {
        let optimizer = tf.train.adam(1e-4);

        this.action_size = action_size;
		this.state_size = state_size;
		this.num_hidden = num_hidden;

        if(actions_index) this.actions_index = actions_index;

        this.model = this.build_model();
    }

    build_model() {

        const input = tf.layers.input({shape: [9, 12]}); //oneHot state shape

        const fc1 = tf.layers.dense({
            units: this.num_hidden,
            name: 'dense1',
            activation: 'relu',
		});
		
		const flatten = tf.layers.flatten();

        const policy_output = tf.layers.dense({
            units: this.action_size,
            name:'policy'
        });

        const fc2 = tf.layers.dense({
            units: this.num_hidden,
            name: 'dense2',
            activation: 'relu',
        });

        const value_output = tf.layers.dense({
            units: 1,
            name: 'value'
        });

        const output1 = policy_output.apply(flatten.apply(fc1.apply(input)));
        const output2 = value_output.apply(flatten.apply(fc2.apply(input)));

        const model = tf.model({inputs:input, outputs: [output1, output2]});
      
		model.summary();
        return model;
    }

     call(input) {
         const result = this.model.predict(input);
         return {'logits': result[0], 'values': result[1]};
     }

     get_trainable_weights() {
         return this.model.getWeights();
     }


}

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

function compute_loss(done, new_state, memory, agent, gamma=0.99) {
	let reward_sum = 0.;
	if(done) {
		reward_sum = 0.;
	} else {
		reward_sum = agent.call(tf.oneHot(new_state, 12).reshape([1, 9, 12]))
					.values.flatten().get(0);
	}

	let discounted_rewards = [];
	let memory_reward_rev = memory.rewards;
	for(let reward of memory_reward_rev.reverse()) {
		reward_sum = reward + gamma * reward_sum;
		discounted_rewards.push(reward_sum);
    }
    discounted_rewards = discounted_rewards.reverse();

	let onehot_states = [];
	for(let state of memory.states) {
		onehot_states.push(tf.oneHot(state, 12));
	}
    let init_onehot = onehot_states[0];
    
	for(let i=1; i<onehot_states.length;i++) {
		init_onehot = init_onehot.concat(onehot_states[i]);
    }
    
	let log_val = agent.call(
		init_onehot.reshape([memory.states.length, 9, 12])
    );
    
    let disc_reward_tensor = tf.tensor(discounted_rewards);
    let advantage = disc_reward_tensor.reshapeAs(log_val.values).sub(log_val.values);
    let value_loss = advantage.square();
    log_val.values.print();

	let policy = tf.softmax(log_val.logits);
	let logits_cpy = log_val.logits.clone();

	let entropy = policy.mul(logits_cpy.mul(tf.scalar(-1))); 
	entropy = entropy.sum();
	
    let memory_actions = [];
    for(let i=0; i< memory.actions.length; i++) {
        memory_actions.push(new Array(2000).fill(0));
        memory_actions[i][memory.actions[i]] = 1;
    }
    memory_actions = tf.tensor(memory_actions);
    let policy_loss = tf.losses.softmaxCrossEntropy(memory_actions.reshape([memory.actions.length, 2000]), log_val.logits);
    console.log(policy_loss);
    policy_loss.print();
    let value_loss_copy = value_loss.clone();
    let entropy_mul = (entropy.mul(tf.scalar(0.01))).mul(tf.scalar(-1));
	let total_loss_1 = value_loss_copy.mul(tf.scalar(0.5, dtype='float32'));
    
    let total_loss_2 = total_loss_1.add(policy_loss);
    let total_loss = total_loss_2.add(entropy_mul);
    total_loss.print();
	return total_loss.mean();
	
}


let agent = new Agent(2000, 12, 24);
let memory = new Memory();
memory.store([false,false,false,false,0,50,0,100,0], 2, 5);
memory.store([false,false,true,false,0,50,0,100,0], 0, 1);

let loss = compute_loss(false, [false,false,false,false,0,50,0,100,0], memory, agent);

