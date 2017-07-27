'use strict';
const tredux = require('tredux');

export const TYPE = {
  LOGIN: 'ui.login.unloq',
  LOGOUT: 'ui.login.logout',
  CHECK: 'ui.login.check'
};

export function logout() {
  return {
    type: TYPE.LOGOUT
  }
}

export function check() {
  return {
    type: TYPE.CHECK
  }
}

export function login(token) {
  return {
    type: TYPE.LOGIN,
    payload: {
      token: token
    }
  }
}

tredux.addActions('auth', module.exports);
