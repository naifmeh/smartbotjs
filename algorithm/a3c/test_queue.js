const worker_utils = require('./worker_utils');

(async() => {
    worker_utils.create_queue();
    let data = await worker_utils.get_blocking_queue();
    console.log(data);
})();