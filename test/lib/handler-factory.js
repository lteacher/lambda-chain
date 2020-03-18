'use strict'

const _ = require('lodash');
const sinon = require('sinon');
const sinonTest = require('sinon-test');
const expect = require('chai').expect;
const assert = require('chai').assert;
const HandlerFactory = require('../../lib/handler-factory');
const Handler = require('../../lib/handlers').Handler;
const lambda = new HandlerFactory();

sinon.test = sinonTest.configureTest(sinon);

function firstMockFn() {
  return 'first';
}

function secondMockFn() {
  return 'second';
}

class MockHandler extends Handler {
  handle() {
    return 'get mocked noob';
  }
}

beforeEach(() => lambda.reset());

describe('HandlerFactory', () => {

  describe('module.exports', () => {
    it('should export an instantiated empty HandlerFactory', () => {
      expect(lambda.constructor.name).to.be.equal('HandlerFactory');
      expect(lambda._handlers).to.be.eql({});
      expect(lambda._hooks).to.be.eql({ before: {}, after: {} });
    });
  });

  describe('#_validateHandler', () => {
    it('should throw an error when a handler is not a function', () => {
      expect(() => lambda._validateHandler('fn', 'not a function')).to.throw(
        /No valid handlers were provided/
      );
    });

    it('should throw an error when given an empty name', () => {
      let nMsg = 'Function name is unknown. Handlers can\'t be anonymous';
      let rMsg = 'If you use anonymous functions you must use registerByName()';

      expect(() => lambda._validateHandler(undefined, console.log)).to.throw(
        new RegExp(`(${nMsg})\n${rMsg}`)
      );
    });
  });

  describe('#isRegistered', () => {
    it('should validate handlers on register', sinon.test(function() {
      let _validateHandlerSpy = this.spy(lambda, '_validateHandler');

      lambda.registerByName('testHandler', () => 'tested!');
      expect(_validateHandlerSpy.called).to.be.ok;
    }));

    it('should return true if a function name is registered', () => {
      lambda.registerByName('testHandler', () => 'tested!');

      expect(lambda.isRegistered('testHandler')).to.be.ok;
    });

    it('should return true if a function is registered', () => {
      lambda.registerByName('firstMockFn', firstMockFn);

      expect(lambda.isRegistered(firstMockFn)).to.be.ok;
    });

    it('should return false if the name is not registered', () => {
      expect(lambda.isRegistered('blah')).to.not.be.ok;
    });

    it('should return false if the function is not registered', () => {
      expect(lambda.isRegistered(firstMockFn)).to.not.be.ok;
    });
  });

  describe('#registerByName', () => {
    it('should register an anonymous function by name', () => {
      lambda.registerByName('testHandler', () => 'tested!');

      expect(lambda._handlers['testHandler']()).to.be.equal('tested!');
    });

    it('should register a named function against a given name', () => {
      lambda.registerByName('testHandler', firstMockFn);

      expect(lambda._handlers['testHandler']()).to.be.equal('first');
    });

    it('should register a named function only once', () => {
      lambda.registerByName('testHandler', () => 'tested!');
      lambda.registerByName('testHandler', firstMockFn);

      expect(lambda._handlers['testHandler']()).to.be.equal('tested!');
    });

    it('should register a Handler class by name', () => {
      lambda.registerByName('testHandler', MockHandler);

      const TestHandler = lambda._handlers['testHandler'];
      expect(new TestHandler().handle()).to.be.equal('get mocked noob');
    });

    it('should throw an error if called with 3 or more args', () => {
      lambda.registerByName('testHandler', () => 'tested!');
      lambda.registerByName('testHandler', firstMockFn);


      expect(() => lambda.registerByName(1, 2, 3)).to.throw(
        'No more than two args can be supplied. To provide hooks, use register or before / after'
      )
    });
  });

  describe('#register', () => {
    it('should call registerByName when registering', sinon.test(function() {
      let registerByNameSpy = this.spy(lambda, 'registerByName');
      lambda.register(firstMockFn);
      expect(registerByNameSpy.called).to.be.ok;
    }));

    it('should register a named function', () => {
      lambda.register(firstMockFn);

      expect(lambda._handlers['firstMockFn']()).to.be.equal('first');
    });

    it('should register an array of named functions', () => {
      lambda.register([firstMockFn, secondMockFn]);

      expect(lambda._handlers['firstMockFn']()).to.be.equal('first');
      expect(lambda._handlers['secondMockFn']()).to.be.equal('second');
    });

    it('should register an object of any functions', () => {
      lambda.register({
        status: () => 'status',
        other: () => 'boom'
      });

      expect(lambda._handlers['status']()).to.be.equal('status');
      expect(lambda._handlers['other']()).to.be.equal('boom');
    });

    it('should register a Handler class directly (though not useful)', () => {
      lambda.register(MockHandler);
      const TestHandler = lambda._handlers['MockHandler'];

      expect(new TestHandler().handle()).to.be.equal('get mocked noob');
    });

    it('should throw an error registering an anonymous function', () => {
      expect(() => lambda.register(() => 'explodez')).to.throw(
        /If you use anonymous functions you must use registerByName()/
      );
    });

    it('should throw an error registering a Handler instance', () => {
      const mock = new MockHandler();
      expect(() => lambda.register(mock)).to.throw(
        /No valid handlers were provided/
      );
    });

    it('should add before hooks on register', () => {
      lambda.register(firstMockFn, {
        before: () => 'poww'
      });

      expect(lambda._handlers['firstMockFn']()).to.be.equal('first');
      expect(lambda._hooks['before']['firstMockFn'][0]()).to.be.equal('poww');
      expect(_.size(lambda._hooks['before'])).to.be.equal(1);
      expect(_.isEmpty(lambda._hooks['after'])).to.be.ok;
    });

    it('should add after hooks on register', () => {
      lambda.register(firstMockFn, {
        after: () => 'also poww'
      });

      expect(lambda._handlers['firstMockFn']()).to.be.equal('first');
      expect(lambda._hooks['after']['firstMockFn'][0]()).to.be.equal('also poww');
      expect(_.size(lambda._hooks['after'])).to.be.equal(1);
      expect(_.isEmpty(lambda._hooks['before'])).to.be.ok;
    });

    it('should add before and after hooks on register', () => {
      lambda.register(firstMockFn, {
        before: () => 'poww',
        after: () => 'also poww'
      });

      expect(lambda._handlers['firstMockFn']()).to.be.equal('first');
      expect(lambda._hooks['before']['firstMockFn'][0]()).to.be.equal('poww');
      expect(lambda._hooks['after']['firstMockFn'][0]()).to.be.equal('also poww');
      expect(_.size(lambda._hooks['before'])).to.be.equal(1);
      expect(_.size(lambda._hooks['after'])).to.be.equal(1);
    });
  });

  describe('#_addHooks', () => {
    it('should throw an error when given a handler without a name', () => {
      expect(() => lambda._addHooks('before', () => 'explodez', 'hax')).to.throw(
        'Handler name missing. Hooks can\'t be added'
      );
    })

    it('should add global before hooks', () => {
      lambda._addHooks('before', '*', () => 'magic');
      expect(lambda._hooks['before']['*'][0]()).to.be.equal('magic');
      expect(_.size(lambda._hooks['before'])).to.be.equal(1);
      expect(_.size(lambda._hooks['after'])).to.be.equal(0);
    });

    it('should add global after hooks', () => {
      lambda._addHooks('after', '*', () => 'magical');
      expect(lambda._hooks['after']['*'][0]()).to.be.equal('magical');
      expect(_.size(lambda._hooks['after'])).to.be.equal(1);
      expect(_.size(lambda._hooks['before'])).to.be.equal(0);
    });

    it('should add named before hooks', () => {
      lambda._addHooks('before', 'testHandler', () => 'magic');
      expect(lambda._hooks['before']['testHandler'][0]()).to.be.equal('magic');
      expect(_.size(lambda._hooks['before'])).to.be.equal(1);
      expect(_.size(lambda._hooks['after'])).to.be.equal(0);
    });

    it('should add named after hooks', () => {
      lambda._addHooks('after', 'testHandler', () => 'magic');
      expect(lambda._hooks['after']['testHandler'][0]()).to.be.equal('magic');
      expect(_.size(lambda._hooks['before'])).to.be.equal(0);
      expect(_.size(lambda._hooks['after'])).to.be.equal(1);
    });

    it('should add hooks to a passed handler', () => {
      lambda._addHooks('after', 'firstMockFn', () => 'magic');
      expect(lambda._hooks['after']['firstMockFn'][0]()).to.be.equal('magic');
      expect(_.size(lambda._hooks['before'])).to.be.equal(0);
      expect(_.size(lambda._hooks['after'])).to.be.equal(1);
    });

    it('should add an array of hooks', () => {
      lambda._addHooks('before', '*', [firstMockFn, secondMockFn]);
      expect(lambda._hooks['before']['*'][0]()).to.be.equal('first');
      expect(lambda._hooks['before']['*'][1]()).to.be.equal('second');
      expect(_.size(lambda._hooks['before'])).to.be.equal(1);
      expect(_.size(lambda._hooks['after'])).to.be.equal(0);
    });
  });

  describe('#before', () => {
    it('should call _addHooks to add `before` hooks to a function', sinon.test(function() {
      let _addHooksSpy = this.spy(lambda, '_addHooks');
      lambda.before(firstMockFn, () => 'kewl');
      expect(_addHooksSpy.calledOnce).to.be.ok;
      expect(lambda._hooks['before']['firstMockFn'][0]()).to.be.equal('kewl');
    }));

    it('should add global hooks when given just a handler', sinon.test(function() {
      let _addHooksSpy = this.spy(lambda, '_addHooks');
      lambda.before(() => 'kewl');
      expect(_addHooksSpy.calledOnce).to.be.ok;
      expect(lambda._hooks['before']['*'][0]()).to.be.equal('kewl');
    }));

    it('should add hooks for a given named handler', sinon.test(function() {
      let _addHooksSpy = this.spy(lambda, '_addHooks');
      lambda.before(secondMockFn, () => 'also kewl', 'mockFn');
      expect(_addHooksSpy.calledOnce).to.be.ok;
      expect(lambda._hooks['before']['mockFn'][0]()).to.be.equal('also kewl');
    }));
  });

  describe('#after', () => {
    it('should call _addHooks to add `after` hooks to a function', sinon.test(function() {
      let _addHooksSpy = this.spy(lambda, '_addHooks');
      lambda.after(secondMockFn, () => 'also kewl');
      expect(_addHooksSpy.calledOnce).to.be.ok;
      expect(lambda._hooks['after']['secondMockFn'][0]()).to.be.equal('also kewl');
    }));

    it('should add global hooks when given just a handler', sinon.test(function() {
      let _addHooksSpy = this.spy(lambda, '_addHooks');
      lambda.after(() => 'kewl');
      expect(_addHooksSpy.calledOnce).to.be.ok;
      expect(lambda._hooks['after']['*'][0]()).to.be.equal('kewl');
    }));

    it('should add hooks for a given named handler', sinon.test(function() {
      let _addHooksSpy = this.spy(lambda, '_addHooks');
      lambda.after(secondMockFn, () => 'also kewl', 'mockFn');
      expect(_addHooksSpy.calledOnce).to.be.ok;
      expect(lambda._hooks['after']['mockFn'][0]()).to.be.equal('also kewl');
    }));
  });

  describe('#reset', () => {
    it('should clear any handlers and hooks', () => {
      lambda.register(firstMockFn, {
        before: () => 'do nothing',
        after: [() => 'lots of nothing']
      })
      lambda.reset();
      expect(lambda._handlers).to.be.eql({});
      expect(lambda._hooks).to.be.eql({ before: {}, after: {} });
    });
  });

  // TODO: Consider that `hooks` truly includes handler... Makes sense where
  // its used but the naming is off for this function. Should rename, maybe getFunctions?
  describe('#_getHooks', () => {
    it('should get the hooks for a named function', () => {
      lambda.register(secondMockFn, {
        before: () => 'first hook',
        after: () => 'second hook'
      });

      let hooks = lambda._getHooks('secondMockFn');
      expect(hooks.length).to.be.equal(3);
      expect(hooks[0]()).to.be.equal('first hook');
      expect(hooks[1]()).to.be.equal('second'); // The handler
      expect(hooks[2]()).to.be.equal('second hook');
    });

    it('should get the hooks for anonymous functions', () => {
      let handler = {
        tester: () => 'handler town'
      };

      lambda.register(handler, { after: () => 'after hook' });

      let hooks = lambda._getHooks('tester');
      expect(hooks.length).to.be.equal(2);
      expect(hooks[0]()).to.be.equal('handler town');
      expect(hooks[1]()).to.be.equal('after hook');
    });

    // TODO: This test highlights a flaw in the design where we can't
    // choose the order of named vs global? If we had gone with adding all
    // chains to each name then it would be more flexible but slower to add
    // and large space wise
    it.skip('should get global and named hooks', () => {
      lambda.register(firstMockFn);
      lambda.register(secondMockFn);
      lambda.before(() => 'global before hook');
      lambda.before(secondMockFn, () => 'named before hook');
      lambda.before(firstMockFn, () => 'never called');
      lambda.after(secondMockFn, [() => 1, () => 2]);
      lambda.after(() => 'global after hook');

      let hooks = lambda._getHooks('secondMockFn');

      expect(hooks.length).to.be.equal(6);
      expect(hooks[0]()).to.be.equal('global before hook');
      expect(hooks[1]()).to.be.equal('named before hook');
      expect(hooks[2]()).to.be.equal('second');
      expect(hooks[3]()).to.be.equal(1);
      expect(hooks[4]()).to.be.equal(2);
      expect(hooks[5]()).to.be.equal('global after hook');
    });
  });

  // TODO: Another bad name. It calls the functions so
  // its not just `building` stuff
  describe('#_buildExecutionChain', () => {

    it('should always return a Promise', (done) => {
      lambda.register(firstMockFn);
      let chain = lambda._buildExecutionChain('firstMockFn');

      expect(chain).to.be.an.instanceOf(Promise);
      chain.then(response => {
        expect(response).to.be.equal('first');
      }).then(done);
    });

    it('should call _getHooks', sinon.test(function() {
      lambda.register(firstMockFn);
      let _getHooksSpy = this.spy(lambda, '_getHooks');
      let chain = lambda._buildExecutionChain('firstMockFn');

      expect(_getHooksSpy.calledOnce).to.be.ok;
    }));

    it('should chain the hooks together', sinon.test(function(done) {
      let hooks = {
        first: () => 'first',
        second: (event, context, res) => {expect(res).to.be.equal('first'); return 'second'; },
        last: (event, context, res) => {expect(res).to.be.equal('second'); return 'last'; }
      }

      const firstSpy = this.spy(hooks, 'first');
      const secondSpy = this.spy(hooks, 'second');
      const lastSpy = this.spy(hooks, 'last');

      lambda.register(firstMockFn);
      lambda.after(firstMockFn, hooks.first);
      lambda.after(firstMockFn, hooks.second);
      lambda.after(firstMockFn, hooks.last);

      const chain = lambda._buildExecutionChain('firstMockFn');

      chain
        .then((res) => expect(res).to.be.equal('last'))
        .then(() => {
          expect(firstSpy.calledOnce).to.be.ok;
          expect(secondSpy.calledOnce).to.be.ok;
          expect(lastSpy.calledOnce).to.be.ok;
          done();
        });
    }));

    it('should include Handler classes in the chain', (done) => {
      let hooks = {
        first: () => 'first',
        last: (event, context, res) => {
          expect(res).to.be.equal('handled!');
          return 'last';
        }
      }

      class TestHandler extends Handler {
        handle(res) {
          expect(res).to.be.equal('first');
          return 'handled!'
        }
      }

      lambda.register(TestHandler);
      lambda.before(TestHandler, hooks.first);
      lambda.after(TestHandler, hooks.last);

      const chain = lambda._buildExecutionChain('TestHandler');

      chain
        .then(res => { expect(res).to.be.equal('last') })
        .then(done)
        .catch(done);
    });
  });

  describe('#_execHandler', () => {

    it('should call _buildExecutionChain', sinon.test(function(done) {
      const chainSpy = this.spy(lambda, '_buildExecutionChain');

      lambda.register(firstMockFn);

      lambda._execHandler('firstMockFn')(null, null, (err, res) => {
        expect(chainSpy.calledOnce).to.be.ok;
        expect(res).to.be.equal('first');
        done();
      });
    }));

    it('should pass errors to the callback', (done) => {
      lambda.registerByName('rekt', () => {throw new Error('boom!')});

      lambda._execHandler('rekt')(null, null, (err, res) => {
        expect(err.message).to.be.equal('boom!');
        done();
      });
    });
  });

  describe('#exports', () => {
    it('should return an object with all the handlers', () => {
      const handlers = {
        first: () => 'first',
        second: () => 'second',
        third: () => 'third'
      }

      lambda.register(handlers);

      expect(_.keys(lambda.exports())).to.have.members([
        'first', 'second', 'third'
      ]);
    });
  });
});
