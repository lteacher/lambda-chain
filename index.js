'use strict'

const HandlerFactory = require('./lib/handler-factory');
const Handler = require('./lib/handlers').Handler;
const HttpEventHandler = require('./lib/handlers').HttpEventHandler;

const factory = new HandlerFactory();

// Redefininitions
module.exports = {
  register: factory.register.bind(factory),
  registerByName: factory.registerByName.bind(factory),
  isRegistered: factory.isRegistered.bind(factory),
  before: factory.before.bind(factory),
  after: factory.after.bind(factory),
  exports: factory.exports.bind(factory),
  Handler: Handler,
  HttpEventHandler: HttpEventHandler
}
