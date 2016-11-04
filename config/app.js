'use strict';
module.exports = {
  "admin.token": process.env.ADMIN_TOKEN,
  "transport.http": {
    port: process.env.PORT || 18000,
    payloadLimit: 500000,
    debug: false
  },
  "store.redis": {
    "host": process.env.REDIS_HOST || "localhost",
    "port": process.env.REDIS_PORT || 6379,
    "password": process.env.REDIS_PASSWORD || null
  },
  "store.redis.prefix": "t-discovery",
  "config.maxSize": 10000 // max number of chars for the config actions
};

if (process.env.SCONFIG_KEY) {
  thorin
    .addConfig('sconfig', {
      version: process.env.SCONFIG_VERSION || 'master'
    });
}
if(process.env.LOGLET_KEY) {
  thorin.addPlugin(require('thorin-plugin-loglet'));
}