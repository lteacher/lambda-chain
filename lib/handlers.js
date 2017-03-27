'use strict'

const _ = require('lodash');

class Handler {
  constructor(event, context) {
    this.event = event;
    this.context = context;
  }

  handle() { this.throwUnimplemented('handle'); }

  throwUnimplemented(name) {
    throw new TypeError(`${this.constructor.name} does not implement ${name}`);
  }
}

class HttpEventHandler extends Handler {
  handle() {
    this.httpMethod = _.lowerCase(this.event.httpMethod);

    if(!this[this.httpMethod]) this.throwUnimplemented(this.httpMethod);

    return this[this.httpMethod]();
  }
}

module.exports = {
  Handler: Handler,
  HttpEventHandler: HttpEventHandler
}
