const tf = require('@tensorflow/tfjs-node-gpu');

class Agent {
    constructor(action_size, state_size, num_hidden, actions_index=undefined) {
        let optimizer = tf.train.adam(1e-4);

        this.action_size = action_size;
		this.state_size = state_size;
		this.num_hidden = num_hidden;

        if(actions_index) this.actions_index = actions_index;

        this.actor = this.build_actor();
        this.critic = this.build_critic();
    }

    build_actor() {
        let model = tf.sequential();
        
        tf.add(tf.layers.input({
            shape: [9, 12]
        }));

        tf.add(tf.layers.dense({
            activation: 'relu',
            units: this.num_hidden,
        }));

        tf.add(tf.layers.flatten());

        tf.add(tf.layers.dense({
            activation: 'softmax',
            units: this.action_size,
        }));

        model.compile({
            optimizer: tf.train.adam(1e-4),
            loss: tf.losses.softmaxCrossEntropy
        });

        return model;
    }

    build_critic() {
        let model = tf.sequential();
        
        tf.add(tf.layers.input({
            shape: [9, 12]
        }));

        tf.add(tf.layers.dense({
            activation: 'relu',
            units: this.num_hidden,
        }));

        tf.add(tf.layers.flatten());

        tf.add(tf.layers.dense({
            activation: 'softmax',
            units: this.action_size,
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

    train_model(done, memory, reward, next_state) {
        let target = tf.zeros([1, this.value_size]);
        let advantages = tf.zeros([1, this.action_size]);

        let tf_oneHotStates;
        for(let i=0; i< memory.states.length; i++) {
            if(i===0) tf_oneHotStates = tf.oneHot(this.format_state(memory.state[i]), 12);
            else tf_oneHotStates.concat(tf.oneHot(this.format_state(memory.state[i]), 12))
        }
        tf_oneHotStates.reshape([memory.states.length, 9, 12]);

        // let oneHotState = tf.oneHot(this.format_state(state), 12);
        let oneHotNextState = tf.oneHot(this.format_state(next_state), 12);
        //oneHotState = oneHotState.reshape([1, 9, 12])
        oneHotNextState = oneHotNextState.reshape([1, 9, 12])
        let value = this.critic.predict(oneHotStates).reshape([memory.states.length, 1]);
        let next_value = this.critic.predict(oneHotNextState);

        let reward_sum = 0.;
        if(done) {
            reward_sum = 0.;
        } else {
            reward_sum = this.local_model.call(tf.oneHot(next_state, 12).reshape([1, 9, 12]))
                        .values.flatten().get(0);
        }
    
        let discounted_rewards = [];
        let memory_reward_rev = memory.rewards;
        for(let reward of memory_reward_rev.reverse()) {
            reward_sum = reward + gamma * reward_sum;
            discounted_rewards.push(reward_sum);
        }
        
        if(done) {
            advantages[action] = [reward - value];
            target[0] = reward;
        } else {
            advantages[action] =  [reward +this.discount_factor * (next_value) - value];
            target[0] = reward + this.discount_factor * next_value;
        }

        
        this.actor.fit(oneHotStates, tf.tensor(advantages).reshape([1,2047]), {
            epochs:1,
        });

        this.critic.fit(oneHotStates, tf.tensor(target), {
            epochs:1,
        });
        
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
	discounted_rewards.reverse();

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
    
    let value_loss_copy = value_loss.clone();
    let entropy_mul = (entropy.mul(tf.scalar(0.01))).mul(tf.scalar(-1));
	let total_loss_1 = value_loss_copy.mul(tf.scalar(0.5, dtype='float32'));
    
    let total_loss_2 = total_loss_1.add(policy_loss);
    let total_loss = total_loss_2.add(entropy_mul);
    total_loss.print();
	return total_loss.mean();
	
}


const tst = tf.variable([2]);
const a = tf.tensor([2,1]);
const f = () => tst.mul(a).sum();

let grad = tf.grad(f);
grad.print();




