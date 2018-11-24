const expect = require('chai').expect;
const utils = require('../algorithm/utils').algo_utils;

describe('Generate_step_array should return an array containing steps between 0 and max', function() {

    context('From 0 to 30 with step of 10', function() {
        it('Should return 0,10 10,20 20,30',
            function() {
                let expected = [[0,10], [10, 20], [20, 30]];
                let result = utils.generate_step_array(30, 10);
                expect(result).to.eql(expected); //Deep equal on values
            });
    });
})