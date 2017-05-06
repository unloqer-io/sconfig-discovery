'use strict';
const tredux = require('tredux');

export const TYPE = {
  DATA: 'ui.config.data.set',
  READ: 'ui.config.read',
  SAVE: 'ui.config.save',
  TOKEN: 'ui.config.token'
};
tredux.addActions('config', module.exports);

export function setToken(token) {
  return {
    type: TYPE.TOKEN,
    payload: {
      token
    }
  };
}

export function setData(data) {
  return {
    type: TYPE.DATA,
    payload: {
      data
    }
  }
}

export function read(token) {
  return {
    type: TYPE.READ,
    payload: {
      token
    }
  }
}

export function save(data, token) {
  return {
    type: TYPE.SAVE,
    payload: {
      token,
      data
    }
  }
}


