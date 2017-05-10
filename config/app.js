'use strict';
const API_PORT = process.env.PORT || 18000,
  WEB_PORT = process.env.WEB_PORT || 18001;
module.exports = {
  "admin.token": process.env.ADMIN_TOKEN,
  "admin.emails": [],
  "transport.http": {
    actionPath: ['/dispatch', '/'],
    port: (global.THORIN_APP === 'web' ? WEB_PORT : API_PORT),
    payloadLimit: 500000,
    static: global.THORIN_APP === 'web' ? thorin.root + '/public' : false,
    debug: false
  },
  "store.redis": {
    "prefix": process.env.REDIS_PREFIX || "t-discovery",
    "namespace": "disc",
    "host": "localhost",
    "port": 6379
  },
  "config.maxSize": 50000, // max number of chars for the config actions
  /* UI-specific settings */
  "plugin.render.path": "public/",
  "plugin.session": {
    cookieName: 'discui',
    namespace: 't-session',
    store: 'redis'
  }
};

if (process.env.ADMIN_EMAIL) {
  let mails = process.env.ADMIN_EMAIL.replace(/ /g, '').split(',');
  module.exports['admin.emails'] = mails;
}

if (process.env.REDIS_HOST) {
  module.exports['store.redis'].host = process.env.REDIS_HOST;
}
if (process.env.REDIS_PORT) {
  module.exports['store.redis'].port = parseInt(process.env.REDIS_PORT);
}
if (process.env.REDIS_PASS || process.env.REDIS_PASSWORD) {
  module.exports['store.redis'].password = process.env.REDIS_PASS || process.env.REDIS_PASSWORD;
}
if (process.env.REDIS_CLUSTERED) {
  module.exports['store.redis'].clustered = true;
}

if (process.env.SCONFIG_KEY) {
  thorin
    .addConfig('sconfig', {
      version: process.env.SCONFIG_VERSION || 'master'
    });
}
if (process.env.LOGLET_KEY) {
  thorin.addPlugin(require('thorin-plugin-loglet'));
}