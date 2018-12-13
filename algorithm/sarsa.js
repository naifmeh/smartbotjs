

function sarsa() {
    const math_utils = require('../utils/math_utils');

    const environment = require('./environment')().EnvironmentController(100);


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

    async function algo(num_episode, discount_factor = 1.0, alpha = 0.5, epsilon = 0.1, offline=false) {
        let init_loop_state = 0;
        let episode_done = false;

        async function save_data(data) {
            const serialiser = require('../utils/serialisation');
            data.init_loop_state = init_loop_state;
            data.Q = Q;
            data.reward_plotting = reward_plotting;
            data.action_probs = action_probs;
            data.action = action;
            data.done = done;
            data.state = state;

            await serialiser.serialise(data, 'algorithm_state.json');
            return Promise.resolve();
        }

        async function unsave() {
            return new Promise(resolve => {
                const serializer = require('../utils/serialisation');
                let data = serializer.unserialise('algorithm_state.json');
                environment.setEnvironmentData(data);
                init_loop_state = data.init_loop_state;
                Q = data.Q;
                action = data.action;
                done = data.done;
                state = data.state;
                action_probs = data.action_probs;
                resolve();
            });
        }

        process.on('SIGINT', () => {
            (async() => {
                if(offline) {
                    while (!episode_done) ;
                    let data = environment.getEnvironmentData();
                    await save_data(data);
                    process.exit();
                }
            })();

        });

        if(!offline)
            await environment.init_env();
        let data = environment.getEnvironmentData();

        const AMOUNT_ACTIONS = data.actions.length;

        let Q = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : new Array(AMOUNT_ACTIONS).fill(0)
        });

        let policy = make_epsilon_greedy_policy(Q, epsilon, AMOUNT_ACTIONS);

        let reward_plotting = {};
        if(offline) {
            await unsave();
        }
        for (let i = init_loop_state; i < num_episode; i++) {
            episode_done = false;
            init_loop_state = i;
            reward_plotting[i] = 0;

            var state = environment.reset(); // Reset the environment

            var action_probs = policy(state);
            var action = math_utils.weightedRandomItem(data.actions, action_probs); //todo: change to refer to the indexes

            while (true) {
                var step_data = await environment.step(action);

                var next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;

                reward_plotting[i] += reward;

                var next_action_probs = policy(next_state);
                var next_action = math_utils.weightedRandomItem(data.actions, next_action_probs);

                let td_target = reward + discount_factor * Q[next_state][next_action];
                let td_delta = td_target - Q[state][action];

                Q[state][action] += alpha * td_delta;


                if (done)
                    break;

                action = next_action;
                state = next_state;

            }
            episode_done = true;
        }

        return Promise.resolve({
            Q: Q,
            reward_plotting: reward_plotting,
        });
    }

    return {
        execute_algo: algo,
    }
}
module.exports = new sarsa();
let sars = new sarsa();
(async() => {
    let result = await sars.execute_algo(80);
    console.log(result);
})();

