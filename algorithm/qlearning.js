function qlearning() {
    const math_utils = require('../utils/math_utils');
    const defaultDict = require('./utils.js').defaultDict;

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
        const serialiser = require('../utils/serialisation');

        await environment.init_env();


        let data = environment.getEnvironmentData();

        const AMOUNT_ACTIONS = data.actions_index.length;

        let Q = new defaultDict(new Array(AMOUNT_ACTIONS).fill(0));

        let policy = make_epsilon_greedy_policy(Q, epsilon, AMOUNT_ACTIONS);

        let reward_plotting = {};
        let episode_length = 0;


        for (let i = init_loop_state; i < num_episode; i++) {
            episode_done = false;
            init_loop_state = i;
            reward_plotting[i] = 0;

            let state = environment.reset(); // Reset the environment

            while (true) {
                let action_probs = policy(state);
                let action = math_utils.weightedRandomItem(data.actions_index, action_probs);

                data = environment.getEnvironmentData();
                console.log('Episode '+i+' : '+(data.current_step+1)+'/'+(data.length_episode+1));
                let step_data = await environment.step(action);

                let next_state = step_data.state,
                    reward = step_data.reward,
                    done = step_data.done;
                episode_length = step_data.episode_length;

                reward_plotting[i] += reward < 0 ? 1: 0;

                let best_next_action = math_utils.argmax(Q[next_state]);

                //TD Update
                let td_target = reward + discount_factor * Q[next_state][best_next_action];
                let td_delta = td_target - Q[state][action];

                Q[state][action] += alpha * td_delta;

                if (done)
                    break;

                state = next_state;

            }
            reward_plotting[i] = (reward_plotting[i]/(episode_length+1))*100;
            await serialiser.serialise({
                reward_plotting: reward_plotting,
                Q: Q,
            }, 'plot_qlearning.json');
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

let ql = new qlearning();
(async() => {
    const plotting = require('../utils/plotting');
    const serialisation = require('../utils/serialisation');
    let result = await ql.execute_algo(80, 1.0, 0.5, 0.1, false);
    await serialisation.serialise(result, './plot.json');
    plotting.plot_rewards({x: Array.apply(null, {length: result.reward_plotting}).map(Number.call, Number),
        y: result.reward_plotting}, title='Premiere tentative QLEARNING')
})();