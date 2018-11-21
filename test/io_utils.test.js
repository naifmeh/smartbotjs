
const expect = require('chai').expect;
const io_utils = require('../utils/io_utils.js').io_utils;

describe('extract hostname should remove all the surrounding of an url',
    function() {
        const expected = 'www.google.com';
        const result = io_utils.extract_hostname('https://www.google.com');

        context('with url argument', function() {
        it('should return the hostname',
            function() {

            expect(result).to.equal(expected);
            });
        });

        context('url with path parameters', function() {
            it('should return only the hostname', function() {
                let expectedHost = 'naifmehanna.xyz';
                let resultat = io_utils.extract_hostname('https://naifmehanna.xyz/tag/convolutional-paper');

                expect(resultat).to.equal(expectedHost);
            })
        })

        context('with non string argument', function() {
            it('should throw error', function() {
                expect(function() { //Requirement to wrap it in a function by chai
                    io_utils.extract_hostname(85)
                }).
                    to.throw(TypeError, 'Argument should be a string');
            });
        });

    });
