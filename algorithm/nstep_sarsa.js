

function nstep_sarsa() {
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

    async function algo(num_episode, discount_factor = 1.0, alpha = 0.5, epsilon = 0.2, n=10, offline=true) {
        let init_loop_state = 0;
        let episode_done = false;
        const serialiser = require('../utils/serialisation');


        if(!offline)
            await environment.init_env();


        let data = environment.getEnvironmentData();

        const AMOUNT_ACTIONS = data.actions_index.length;

        let Q = new defaultDict(new Array(AMOUNT_ACTIONS).fill(0));

        let policy = make_epsilon_greedy_policy(Q, epsilon, AMOUNT_ACTIONS);

        let reward_plotting = {};
        let episode_length = 0;
        let states = [];
        let actions = [];
        let rewards = [0];

        for (let i = init_loop_state; i < num_episode; i++) {
            episode_done = false;
            init_loop_state = i;
            reward_plotting[i] = 0;

            let state = environment.reset(i); // Reset the environment

            states.push(state);

            let action_probs = policy(state);
            let action = math_utils.weightedRandomItem(data.actions_index, action_probs); //todo: change to refer to the indexes

            actions.push(action);
            let n_steps = 1000000;
            let t=0;
            while (true){
                data = environment.getEnvironmentData();
                console.log('Episode '+i+' : '+(data.current_step+1)+'/'+(data.length_episode+1));
                if(t < n_steps) {
                    let step_data = await environment.step(action);
                    let next_state = step_data.state,
                        reward = step_data.reward,
                        done = step_data.done;
                    rewards.push(reward);
                    reward_plotting[i] += reward < 0 ? 1: 0;
                    states.push(next_state)

                    if(done)
                        n_steps = t+1;
                    else {
                        let next_action_probs = policy(next_state);
                        let next_action = math_utils.weightedRandomItem(data.actions_index, next_action_probs);
                        actions.push(next_action);
                    }

                }
                let pi = t - n + 1;

                if(pi >= 0) {
                    let returns = 0.
                    for(let x=pi+1; x<Math.min(pi+n, n_steps)+1;x++) {
                        returns += Math.pow(discount_factor, x-pi-1) * rewards[x];
                    }

                    if((pi+n) < n_steps) {
                        returns += (discount_factor**n) * Q[states[pi+n]][actions[pi+n]]
                    }

                    Q[states[pi]][actions[pi]] += alpha * (returns - Q[states[pi]][actions[pi]]);

                }
                if(pi === (n_steps-1))
                    break;

                action = next_action;
                state = next_state;
                t++;

            }
            reward_plotting[i] = (reward_plotting[i]/(episode_length+1))*100;
            await serialiser.serialise({
                reward_plotting: reward_plotting,
                Q: Q,
            }, 'plot_nstep_sarsa.json');
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
module.exports = new nstep_sarsa();
let sars = new nstep_sarsa();
(async() => {
    const plotting = require('../utils/plotting');
    const serialisation = require('../utils/serialisation');
    let result = await sars.execute_algo(80, 1.0, 0.5, 0.1, false);
    await serialisation.serialise(result, './plot_nstep.json');
    plotting.plot_rewards({x: Array.apply(null, {length: result.reward_plotting}).map(Number.call, Number),
        y: result.reward_plotting}, title='Premiere tentative N_STEPSARSA')
})();

