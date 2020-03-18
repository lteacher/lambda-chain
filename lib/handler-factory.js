'use strict'

const _ = require('lodash');

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
      throw new Error(
        "Function name is unknown. Handlers can\'t be anonymous\n"+
        "If you use anonymous functions you must use registerByName()"
      );
    }
  }

  // Executes the handler function
  _execHandler(name) {
    return (event, context, cb) => {
      const result = this._buildExecutionChain(name, event, context);

      result.then((value) => cb(null, value)).catch(cb);
    }
  }

  _addHooks(order, name, hooks) {
    if(_.isEmpty(name)) {
      throw new Error('Handler name missing. Hooks can\'t be added');
    }

    hooks = _.castArray(hooks);

    _.forEach(hooks, hook => {
      this._hooks[order][name] = this._hooks[order][name] || []
      this._hooks[order][name].push(hook);
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
  before(handler, hooks, name) {
    if (arguments.length === 1) {
      this._addHooks('before', '*', handler);
    } else {
      if (!name) name = handler.name;

      this._addHooks('before', name, hooks);
    }
  }

  after(handler, hooks, name) {
    if (arguments.length === 1) {
      this._addHooks('after', '*', handler);
    } else {
      if (!name) name = handler.name;

      this._addHooks('after', name, hooks);
    }
  }

  isRegistered(handler) {
    return _.has(this._handlers, _.isFunction(handler) ? handler.name : handler);
  }

  /**
   * Register a single handler function. It will be wrapped and set as an export
   * A handler is just a regular function but it can return a promise
   */
  register(handlers, hooks) {
    let useKey = false;

    if (_.isPlainObject(handlers)) {
      useKey = true;
    } else  {
      handlers = _.castArray(handlers);
    }

    _.forEach(handlers, (handler, key) => {
      let name =  useKey ? key : handler.name;

      this.registerByName(name, handler);

      // Setup the hooks for the handler if any
      if (hooks) {
        _.forEach(_.keys(hooks), (order) => this._addHooks(order, name, hooks[order]));
      }
    });
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
