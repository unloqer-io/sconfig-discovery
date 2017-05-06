'use strict';
/**
 * Console react.js app
 */
const React = require('react'),
  DOM = require('react-dom'),
  api = require('api'),
  tredux = require('tredux'),
  config = require('config');
require('../styles/console.less');
require('reducers/auth');
require('reducers/config');

/* Globalize a few modules */
global.classNames = require('classnames');
global.React = React;

const ConsoleApp = require('containers/ConsoleApp');
DOM.render(<ConsoleApp />, document.getElementById("app"));
