'use strict';
/**
 * Created by Adrian on 12-Apr-16.
 */
const thorin = require('thorin'),
  spawn = require('child_process').spawn;

thorin
  .addTransport(require('thorin-transport-http'))
  .addStore(require('thorin-store-redis'), 'redis');

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
  const data = `
-----------------Thorin.io discovery service-----------------
| Service listening on port ${thorin.config('transport.http.port')}                           |
| In order to create a new discovery namespace, run:        |
|    docker exec -it $DOCKER_ID node create                 |
| In order to modify encrypted configuration, run:          |
|    docker exec -it $DOCKER_ID node config                 |
-------------------------------------------------------------
`;
  console.log(data);
  if (!process.env.DISCOVERY_KEY) return;
  let storeLib = thorin.lib('store');
  storeLib.bootNamespace(process.env.DISCOVERY_KEY).then((added) => {
    if (added) {
      log.debug(`Main namespace created`);
    }
  }).catch((e) => {
    log.error(`Could not initialize boot namespace with discovery key`);
    log.debug(e);
    process.exit(1);
  });
  /* Start the UI if set */
  if (process.env.ADMIN_UI) {
    let admins = thorin.config('admin.emails');
    if (!admins || admins.length === 0) {
      log.warn(`UI skipped, no admins defined in ADMIN_EMAIL env variable`);
    } else {
      startUi();
    }
  }
  function startUi() {
    let logger = thorin.logger('ui');
    let uiObj = spawn('node', ['ui.js'], {
      cwd: process.cwd(),
      env: process.env
    });
    uiObj.stdout.on('data', (data) => {
      let d = data.toString();
      d = d.split('\n');
      if (d[d.length - 1] === '') d.pop();
      d = d.join('\n');
      console.log(d);
    });

    uiObj.stderr.on('data', (data) => {
      let d = data.toString();
      d = d.split('\n');
      if (d[d.length - 1] === '') d.pop();
      d = d.join('\n');
      console.log(d);
    });

    uiObj.on('close', (code) => {
      logger.warn(`UI closed, re-launching...`);
      setTimeout(() => {
        startUi();
      }, 1000);
    });
  }
});