'use strict'

const _ = require('lodash');
const vComp = require('compare-versions');

const requiresName = () => vComp('6.8.0', process.version.substring(1)) >= 0;

/**
 * TODO: Probably refactor. Had to rewrite to native node v4 from magical v7
 */
class HandlerFactory {
  constructor() {
    this.reset();
  }

  // Make sure its just a function for now
  _validateHandler(name, handler) {
    if (!_.isFunction(handler)) throw new Error('No valid handlers were provided');

    if (_.isEmpty(name)) {
      let msg;

      if (requiresName()) {
        msg = [
          'Node version is <6.8.0 so named functions are required.',
          'If you use anonymous functions you must use registerByName()'
        ].join('\n');
      } else {
        msg = [
          'Function name is unknown. Handlers can\'t be anonymous',
          'If you use anonymous functions you must use registerByName()'
        ].join('\n');
      }

      throw new Error(msg);
    }
  }

  // Executes the handler function
  _execHandler(name) {
    return (event, context, cb) => {
      const result = this._buildExecutionChain(name, event, context);

      result.then((value) => cb(null, value)).catch(cb);
    }
  }

  // Tears of sadness after needing to refactor spread operator out :(
  _addHooks() {
    let order, handler, hooks;

    if (arguments.length < 2 || arguments.length > 3) throw new Error('Incorrect number of arguments');

    if (arguments.length == 2) {
      order = arguments[0];
      hooks = arguments[1];
      handler = { name: '*' };
    } else {
      order = arguments[0];
      handler = arguments[1];
      hooks = arguments[2];

      if (typeof handler == 'string') {
        handler = { name: handler };
      }

      if(_.isEmpty(handler.name)) {
        throw new Error('Handler name missing. Hooks can\'t be added');
      }
    }

    if (!_.isArray(hooks)) hooks = [hooks];

    _.forEach(hooks, hook => {
      this._hooks[order][handler.name] = this._hooks[order][handler.name] || []
      this._hooks[order][handler.name].push(hook);
    });
  }

  _buildExecutionChain(name, event, context) {
    let chain = Promise.resolve();

    let hooks = this._getHooks(name);

    _.forEach(hooks, hook => {
      chain = chain.then(response => {
        if (this._isHandlerClass(hook)) {
          return new hook(event, context).handle(response);
        } else {
          return hook(event, context, response);
        }
      })
    });

    // console.log('Class??');
    return chain;
  }

  // Check if the function is a handler
  _isHandlerClass(handler) {
    return _.hasIn(handler, 'prototype.handle');
  }

  // Get the hook functions for some handler
  _getHooks(handlerName) {
    return _.reduce(this._hooks, (result, hooks, order) => {
      let addHooks = _(hooks)
        .filter((hook, name) => name == handlerName || name ==  '*')
        .values()
        .flatten()
        .value()

      return order === 'after' ? _.concat(result, addHooks) : _.concat(addHooks, result);
    }, [this._handlers[handlerName]])
  }

  /**
   * Add single or multiple global, or handler specific hooks before or after
   */
  before() {
    const addHooks = _.curry(this._addHooks, arguments.length + 1);
    addHooks('before').apply(this, arguments);
  }

  after() {
    const addHooks = _.curry(this._addHooks, arguments.length + 1);
    addHooks('after').apply(this, arguments);
  }

  isRegistered(handler) {
    return _.has(this._handlers, _.isFunction(handler) ? handler.name : handler);
  }

  /**
   * Register a single handler function. It will be wrapped and set as an export
   * A handler is just a regular function but it can return a promise
   */
  register(handlers, hooks) {
    let isGlobal = true;
    let useKey = false;

    if (_.isPlainObject(handlers)) {
      useKey = true;
    } else if (!_.isArray(handlers)) {
      handlers = [handlers];
      isGlobal = false;
    }

    _.forEach(handlers, (handler, key) => {
      let name =  useKey ? key : handler.name;

      this.registerByName(name, handler);

      // Setup the hooks for the handler if any
      if (!isGlobal) {
        if (hooks) {
          _.forEach(_.keys(hooks), (order) => this[order](handler, hooks[order]));
        }
      }
    });

    // Setup the hooks for the global if any
    if (isGlobal) {
      if (hooks) {
        _.forEach(_.keys(hooks), (order) => this[order]('*', hooks[order]));
      }
    }
  }

  registerByName(name, handler) {
    if (arguments.length > 2) throw new Error(
      'No more than two args can be supplied. To provide hooks, use register or before / after'
    )

    this._validateHandler(name, handler);

    // Set handler if not registered
    if (!this.isRegistered(name)) this._handlers[name] = handler;
  }

  // Produces an object with the function exports
  exports() {
    return _(this._handlers)
      .keys()
      .reduce((result, name) => (
        _.set(result, name, this._execHandler(name))
      ), {});
  }

  reset() {
    this._handlers = {};
    this._hooks = { before: {}, after: {} };
  }
}

module.exports = HandlerFactory;
