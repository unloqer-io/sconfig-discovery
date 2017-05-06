'use strict';
global.THORIN_AUTOLOAD = false;
global.THORIN_APP = 'web';
/**
 * The Discovery web service.
 */
const thorin = require('thorin');

thorin
  .addTransport(require('thorin-transport-http'))
  .addStore(require('thorin-store-redis'), 'redis')
  .addPlugin(require('thorin-plugin-render'))
  .addPlugin(require('thorin-plugin-session'));

thorin
  .loadPath('app/lib/')
  .loadPath('app/ui/');
log.info(`Launching UI...`);

thorin.run((err) => {
  if (err) {
    return setTimeout(() => {
      process.exit(1);
    }, 100);
  }
  log.info(`UI Listening on port ${thorin.config('transport.http.port')}`);
});