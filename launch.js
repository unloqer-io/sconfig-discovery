'use strict';
/**
 * Created by Adrian on 12-Apr-16.
 */
const thorin = require('thorin');

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
});