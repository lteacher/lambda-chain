# Lambda Chain

> _Promisify lambda handlers and allow before and after function chains_

[![Build Status](https://travis-ci.org/lteacher/lambda-chain.svg?branch=master)](https://travis-ci.org/lteacher/lambda-chain)
[![Coverage Status](https://coveralls.io/repos/github/lteacher/lambda-chain/badge.svg?branch=master)](https://coveralls.io/github/lteacher/lambda-chain?branch=master)
[![npm version](https://badge.fury.io/js/lambda-chain.svg)](https://badge.fury.io/js/lambda-chain)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/lteacher/lambda-chain/master/LICENSE.md)

## Details

This package makes it possible to chain aws lambda functions together by registering handlers and hooks (also just handlers) which can occur before or after a given handler, similar to middleware.

The package also promisifies all handlers so that you don't worry about the callback, instead returning or throwing errors appropriately. This is handy if you are maybe using babel with async / await and want to have it work straight away.

Here is a short full example in some `babel`-ified code

```javascript
import lambda from 'lambda-chain';

// Imaginary async stuffs
const handler = async (event, context) => 'handled...';

// Register the handler, this sets up the promise wrap
// and ability to add before or after hooks here or by name
lambda.register(handler);

// Unwrap the handlers as an export -> { handler: Function }
module.exports = lambda.exports();
```

_**Note:** When using `register`, function names are detected. Different node versions handle function naming differently. You need to consider this when passing function handlers (not hooks)._



## Install

`npm install --save lambda-chain`

## Usage

### register(handler, [hooks])

_Registers a handler and optionally the given hooks._

**handler**: Function|Object|Handler

**hooks**: Object - e.g. ``{ before: Function|Array<Function>, after: Function|Array<Function> }``

**Example**
```javascript
const lambda = require('lambda-chain');
const handlers = require('./cool/handlers');
const parser = require('./magical/parser');

lambda.register(handlers, {
  before: [parser.fromJSON],
  after: [parser.toJSON]
});
```


### before(handler, [hooks])

_Registers a hook or array of hooks to run before the given handler._

**handler**: Function|Handler|String - The handler, or the name of a handler

**hooks**: Function|Array<Function> - The function or functions to execute before the given handler

**Example**
```javascript
const lambda = require('lambda-chain');
const handlers = require('./cool/handlers');
const parser = require('./magical/parser');

lambda.register(handlers);
lambda.before(handler.doStuff, parser.transformThing);
```

### after(handler, [hooks])

_Registers a hook or array of hooks to run after the given handler._

**handler**: Function|Handler|String - The handler, or the name of a handler

**hooks**: Function|Array<Function> - The function or functions to execute after the given handler

**Example**
```javascript
const lambda = require('lambda-chain');
const handlers = require('./cool/handlers');
const {cors} = require('./magical/httpstuffs');

lambda.register(handlers);
lambda.after(handler.doStuff, cors);
```

### Other

There are other ways to use the package but this documentation requires an update. Try taking a look in the tests. For example you can pass an instance of a `Handler` class to the register, such as the `HttpEventHandler` class which just calls the relevant http method.
