function Math_utils() {

    function weightedRandomItem(data, prob) {
        /*if(data.length !== prob.length) {
            throw new Error('Data and probability arrays are not of same length');
        }*/

        let rand = Math.random();
        let threshold = 0;
        for(let i=0; i<prob.length; i++) {
            threshold += prob[i];
            if(threshold > rand) {
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

    function combinations(array, size, output, start=0, initialStuff=[]) {
        if (initialStuff.length >= size) {
            output.push(initialStuff);
        } else {
            let i;
            for (i = start; i < array.length; ++i) {
                combinations(array, size, output, i+1, initialStuff.concat(array[i]));
            }
        }
    }

    function ones(taille) {
        return Array.apply(null, Array(taille)).map(Number.prototype.valueOf, 1);
    }

    function argmax(array) {
        return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
    }



    return {
        weightedRandomItem: weightedRandomItem,
        randomItem: randomItem,
        ones: ones,
        argmax: argmax,
        combinations: combinations,
    }
}

module.exports = new Math_utils();


