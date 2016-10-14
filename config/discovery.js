'use strict';
module.exports = {
  "transport.http": {
    port: 18000,
    payloadLimit: 500000
  },
  "store.redis.prefix": "t-discovery",
  "config.maxSize": 10000 // max number of chars for the config actions
};