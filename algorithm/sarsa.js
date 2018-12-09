
async function sarsa() {
    const math_utils = require('../utils/math_utils');

    const environment = require('./environment')().EnvironmentController(100);
    await environment.init_env();
    let data = environment.getEnvironmentData();

    const AMOUNT_ACTIONS = data.actions.length;

    function make_epsilon_greedy_policy(Q, epsilon, nA) {
        function policy_fn(observation) {
            let A = math_utils.ones(nA,).map((x) => {
                return x * epsilon / nA;
            });
            let best_action = math_utils.argmax(Q[observation]);
            A[best_action] += (1.0 - epsilon);
            return A;
        }
        return policy_fn;
    }

    async function algo(num_episode, discount_factor = 1.0, alpha = 0.5, epsilon = 0.1) {
        const Q = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : new Array(AMOUNT_ACTIONS).fill(0)
        });

        let policy = make_epsilon_greedy_policy(Q, epsilon, AMOUNT_ACTIONS);

        for (let i = 0; i < num_episode; i++) {

            let state = environment.reset();// Reset the environment

            let action_probs = policy(state);
            let action = math_utils.weightedRandomItem(data.actions, action_probs);

            while(true) {
                let step_data = await environment.step(data.actions[action])

                let next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;

                let next_action_probs = policy(next_state);
                let next_action = math_utils.weightedRandomItem(data.actions, next_action_probs);

                let td_target = reward + discount_factor * Q[next_state][next_action];
                let td_delta = td_target - Q[state][action];

                Q[state][action] += alpha * td_delta;

                if(done)
                    break;

                action = next_action;
                state = next_state;

            }
        }
        return {
            Q: Q,
        }
    }

    return {
        sarsa: algo,
    }
}