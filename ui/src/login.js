'use strict';
/**
 * Login react.js app
 */
const React = require('react'),
  DOM = require('react-dom'),
  api = require('api'),
  tredux = require('tredux'),
  config = require('config');
require('../styles/login.less');
require('reducers/auth');

/* Globalize a few modules */
global.classNames = require('classnames');
global.React = React;

const LoginApp = require('containers/LoginApp');

DOM.render(<LoginApp />, document.getElementById("app"));
