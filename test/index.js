'use strict'

const factory = require('../');

const handler = () => {
  console.log('Running in the handler');
}

// factory.registerByName('handler', handler);
factory.registerByName('handler', () => console.log('booya'));

factory.after(() => console.log('After the handler'));

// console.log(factory.exports());
factory.exports()['handler']();
