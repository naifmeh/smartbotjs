
const math_utils = require('../math');
const AMOUNT_ACTIONS = 11;

function make_epsilon_greedy_policy(Q, epsilon, nA) {

    function policy_fn(observation) {
        let A = math_utils.ones(nA,).map((x) => {
            return x * epsilon/nA;
        });
        let best_action = math_utils.argmax(Q[observation]);
        A[best_action] += (1.0 - epsilon);
        return A;
    }

    return policy_fn;
}

function sarsa(num_episode, discount_factor=1.0, alpha=0.5, epsilon=0.1) {
    let Q = {};

    let policy = make_epsilon_greedy_policy(Q, epsilon, AMOUNT_ACTIONS);

    for(let i=0; i<num_episode; i++) {

        let state;// Reset the environment

        let action_probs = policy(state);
        let action = math_utils.weightedRandomItem;
    }
}