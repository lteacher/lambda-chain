'use strict'

// TODO - Actually add tests....
const lambda = require('../');

const handler = () => {
  console.log('Running in the handler');
}

lambda.registerByName('handler', () => console.log('booya'));

module.exports = lambda.exports();
