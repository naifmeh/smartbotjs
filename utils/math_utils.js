function Math_utils() {

    function weightedRandomItem(data, prob) {
        if(data.length !== prob.length) {
            throw new Error('Data and probability arrays are not of same length');
        }

        let rand = Math.random();
        let threshold = 0;
        for(let i=0; i<prob.length; i++) {
            threshold += prob[i];
            if(threshold > rand) {
                console.log(data[i])
                return data[i];
            }
        }
    }

    function randomItem(data) {
        let probs = [];
        for(let i=0; i<data.length; i++) {
            probs.push(1/data.length);
        }
        return weightedRandomItem(data, probs);
    }

    return {
        weightedRandomItem: weightedRandomItem,
        randomItem: randomItem,
    }
}

module.exports = new Math_utils();

