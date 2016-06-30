'use strict';
/**
 * Created by Adrian on 12-Apr-16.
 */
const thorin = require('thorin');

thorin
  .addConfig('sconfig', {
    version: 'master'
  })
  .addTransport(require('thorin-transport-http'))
  .addStore(require('thorin-store-redis'), 'redis');

if (thorin.env === 'production') {
  thorin.addPlugin(require('thorin-plugin-loglet'));
}
if (thorin.env === 'development') {
  thorin.addPlugin(require('thorin-plugin-docs'));
}
thorin.loadPath('app/lib/');

thorin.run((err) => {
  if (err) {
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
});