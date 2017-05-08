'use strict';
/**
 * Created by Adrian on 19-Jan-17.
 */
const tredux = require('tredux'),
  TYPE = require('../actions/config').TYPE;

const reducer = tredux.reducer('config', {
  loaded: false,
  token: null,
  version: null,
  data: null
});
reducer.handle(TYPE.DATA, (state, res) => {
  const payload = res.data || {};
  state.loaded = true;
  if (payload.token) state.token = payload.token;
  if (payload.data) state.data = payload.data;
});

reducer.handle(TYPE.TOKEN, (state, payload) => {
  state.token = payload.token;
});

reducer.handle(TYPE.VERSION, (state, payload) => {
  state.version = payload.version || null;
});