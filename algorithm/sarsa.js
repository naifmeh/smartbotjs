
const math_utils = require('../math')

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