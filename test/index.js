'use strict'

const _ = require('lodash');
const expect = require('chai').expect;
const lambda = require('../');

describe('main package', () => {

  it('should export all the correct functions', () => {
    expect(_.keys(lambda)).to.have.members([
      'register', 'registerByName', 'before', 'after',
      'Handler', 'HttpEventHandler', 'isRegistered'
    ]);
  });
});
