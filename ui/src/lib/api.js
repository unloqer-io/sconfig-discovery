'use strict';
/**
 * Created by Adrian on 05-May-17.
 */
const fetcher = require('thorin-fetch');

let url = window.location.protocol + '//' + window.location.host + '/dispatch';

const apiFetch = fetcher('api', {
  credentials: true,
  url: url
});
const api = {};
api.fetch = function DoFetch(action, payload, _opt) {
  let actionName, actionPayload, opt = {}, fn;
  let args = Array.prototype.slice.call(arguments);
  if (typeof args[args.length - 1] === 'function') fn = args[args.length - 1];
  if (typeof action === 'string') {
    actionName = action;
    actionPayload = payload || {};
  } else if (typeof action === 'object' && action) {
    actionName = action.type;
    actionPayload = action.payload || {};
  }
  if (typeof _opt === 'object' && _opt) {
    opt = Object.assign({}, _opt, opt);
  }
  if (fn) {
    return apiFetch(actionName, {
      payload: actionPayload
    }, opt).then((res) => {
      fn(null, res);
    }, (e) => {
      fn(e, null);
    }).catch((e) => {
      fn(e, null);
    });
  }
  return apiFetch(actionName, {
    payload: actionPayload
  }, opt);
};

module.exports = api;