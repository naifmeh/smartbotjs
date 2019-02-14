const tf = require('@tensorflow/tfjs-node-gpu')

const input = tf.layers.input({shape: [9, 12]}); //oneHot state shape
const fc1 = tf.layers.dense({
				units: 24,	
				name: 'dense1',
				activation: 'relu',
});

const policy_output = tf.layers.dense({
				    units: 2000,
					name:'policy'});

const fc2 = tf.layers.dense({
units: 24,
name: 'dense2',
activation: 'relu',
});

const value_output = tf.layers.dense({
units: 1,
name: 'value', });

const output1 = policy_output.apply(fc1.apply(input));
const output2 = value_output.apply(fc2.apply(input));

const model = tf.model({inputs:input, outputs: [output1, output2]});

console.log(model.predict(tf.ones([1,9,12])));

const loss = tf.scalar(3., 'float32');
const weights = model.getWeights();
const f = (a) => a.sum();


const grad = tf.grads(f);
console.log(grad(weights));
