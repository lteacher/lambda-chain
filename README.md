# Lambda Chain

> _Promisify lambda handlers and allow before and after function chains_

## Install

`npm install --save lambda-chain`

## Usage

This package uses function names to manage the handlers which are exported and wrapped. This is fine in Node v6+ but in v4 if you use anonymous functions or expressions then you must provide a function name.

### Nodejs v6

```javascript
const chain = require('lambda-chain');

// This function is named in v6
const todos = (event, context) => {
  // Logic
}

// Register the handler
chain.register(todos);

module.exports = chain.exports();

```

### Nodejs v4

```javascript
const chain = require('lambda-chain');

// This function is NOT named in v4
const noName = (event, context) => {}

// Register an anonymous handler
chain.registerByName('todos', (event, context) => {
  // Stuffs
});

module.exports = chain.exports();

```
