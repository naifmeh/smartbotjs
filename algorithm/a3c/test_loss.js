const tf = require('@tensorflow/tfjs-node-gpu');

const model = tf.sequential();

model.add(tf.layers.dense({
    inputShape: [1],
    units: 1,
}));

model.compile({
    optimizer: tf.train.adam(1e-4),
    loss: myLoss
});

model.fit(tf.tensor([1, 1]), tf.tensor([1, 2]), {
    epochs: 1
})

function myLoss(x, y) {
    return tf.square(x.sub(y)).sum();
}

for(let i=0; i< model.getWeights().length; i++) {
    model.getWeights()[i].print();
}
let x = tf.variable([2]);
let grads = tf.variableGrads(() => x.mul(tf.scalar(2.0)), model.getWeights());
grads();


