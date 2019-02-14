
module.exports.Queue = class FileQueue {
    constructor(queue_name) {
        this.name = queue_name;
    }

    put(item) {
        const fs = require('fs');
        fs.appendFileSync(this.name+'.txt', item+'\n');
    }

    get() {
        const fs = require('fs');
        let data = fs.readFileSync(this.name+'.txt').toString()
                    .split('\n');
        while(data.length === 1) {
            const wait_until = require('wait-until');
            (async() => {
                    wait_until().interval(500).times(10000)
                .condition((cb) => {
                    process.nextTick(() => {
                        data = fs.readFileSync(this.name+'.txt').toString()
                                .split('\n');
                    });
                }).done(() => {
                    resolve();
                });
            })();

            data = fs.readFileSync(this.name+'.txt').toString()
                                .split('\n');
        }
        let elem = data[data.length-1];
        data.pop();

        for(let i in data) {
            this.put(i);
        }

        return elem;
    }
}

