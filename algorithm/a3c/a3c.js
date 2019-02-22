const Master = require(__dirname+'/agent.js').MasterAgent;
(async() => {
    let master = new Master(1);
    await master.init();
    await master.train();
})();