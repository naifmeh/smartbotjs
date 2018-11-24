

function Algorithm_Utils() {

    function generate_step_array(max, step) {
        let step_arr = []
        for(let i=0; i<max; i+=step) {
            step_arr.push([i, i+step])
        }

        return step_arr
    }

    return {
        generate_step_array: generate_step_array,
    }
}

module.exports.algo_utils = new Algorithm_Utils();
