'use strict';
module.exports = {
  "admin.token": process.env.ADMIN_TOKEN,
  "transport.http": {
    port: process.env.PORT || 18000,
    payloadLimit: 500000,
    debug: false
  },
  "store.redis": {
    "prefix": "t-discovery",
    "namespace": "disc",
    "host": "localhost",
    "port": 6379
  },
  "config.maxSize": 50000 // max number of chars for the config actions
};

if(process.env.REDIS_HOST) {
  module.exports['store.redis'].host = process.env.REDIS_HOST;
}
if(process.env.REDIS_PORT) {
  module.exports['store.redis'].port = parseInt(process.env.REDIS_PORT);
}
if(process.env.REDIS_PASS || process.env.REDIS_PASSWORD) {
  module.exports['store.redis'].password = process.env.REDIS_PASS || process.env.REDIS_PASSWORD;
}

if (process.env.SCONFIG_KEY) {
  thorin
    .addConfig('sconfig', {
      version: process.env.SCONFIG_VERSION || 'master'
    });
}
if(process.env.LOGLET_KEY) {
  thorin.addPlugin(require('thorin-plugin-loglet'));
}