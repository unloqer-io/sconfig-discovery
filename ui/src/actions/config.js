'use strict';
const tredux = require('tredux');

export const TYPE = {
  DATA: 'ui.config.data.set',
  READ: 'ui.config.read',
  SAVE: 'ui.config.save',
  TOKEN: 'ui.config.token',
  VERSION: 'ui.config.version'
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
export function setVersion(version) {
  return {
    type: TYPE.VERSION,
    payload: {
      version
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

export function read(token, version) {
  return {
    type: TYPE.READ,
    payload: {
      version,
      token
    }
  }
}

export function save(data, token, version) {
  return {
    type: TYPE.SAVE,
    payload: {
      token,
      version,
      data
    }
  }
}


