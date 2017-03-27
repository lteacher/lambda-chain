'use strict'

const expect = require('chai').expect;
const Handler = require('../../lib/handlers').Handler;
const HttpEventHandler = require('../../lib/handlers').HttpEventHandler;

describe('Handler', () => {

  describe('#constructor', () => {

    it('should create a Handler as expected', () => {
      const handler = new Handler('event', 'context');
      expect(handler.handle).to.be.ok;
      expect(handler.event).to.be.equal('event');
      expect(handler.context).to.be.equal('context');
    });
  });

  describe('#handle', () => {
    it('should throw an error when calling handle', () => {
      const handler = new Handler('event', 'context');
      expect(() => handler.handle()).to.throw(
        'Handler does not implement handle'
      );
    });

    it('should not throw errors when handle is implemented', () => {
      class TestHandler extends Handler {
        handle() { return 'epic'; }
      }

      expect(new TestHandler().handle()).to.be.equal('epic');
    });
  });
});

describe('HttpEventHandler', () => {

  describe('#constructor', () => {

    it('should create an HttpEventHandler as expected', () => {
      const handler = new HttpEventHandler({ httpMethod: 'POST' }, 'context');
      expect(handler.handle).to.be.ok;
      expect(handler.event).to.be.eql({ httpMethod: 'POST' });
      expect(handler.context).to.be.equal('context');
    });
  });

  describe('#handle', () => {
    it('should throw an http related error when calling handle', () => {
      const handler = new HttpEventHandler({ httpMethod: 'POST' });
      expect(() => handler.handle()).to.throw(
        'HttpEventHandler does not implement post'
      );
    });

    it('should call http methods on a valid implementation', () => {
      class TestHandler extends HttpEventHandler {
        post() { return 'posted' }
        get() { return 'get got'}
        patch() { return 'patch town' }
      }

      expect(new TestHandler({ httpMethod: 'POST' }).handle()).to.be.equal('posted');
      expect(new TestHandler({ httpMethod: 'GET' }).handle()).to.be.equal('get got');
      expect(new TestHandler({ httpMethod: 'PATCH' }).handle()).to.be.equal('patch town');
    });
  });
});
