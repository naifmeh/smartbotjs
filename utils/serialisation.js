

function Serialisation() {

    async function serialise(to_serialise, filename='program_state.json') {
        /*
        We want to serialise :
        - the websites
        - the episode
        - current step
        - current website
        - algo parameters
        - crawler parameters
        -the Q values
         */

        let fs = require('fs');

        return new Promise((resolve, reject) => {
            fs.writeFile(`${__dirname}/../algorithm/${filename}`, JSON.stringify(to_serialise),
                function(err) {
                    if(err) reject(err);
                    resolve();
                });
        });
    }

    async function unserialise(path) {
        let fs = require('fs');

        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if(err) reject(err);
                let state_json = JSON.parse(data);
                resolve(state_json);
            })
        });

    }

    return {
        serialise: serialise,
        unserialise: unserialise,
    }
}

module.exports = new Serialisation();