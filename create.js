'use strict';
/**
 * Creates a new discovery namespace from the CLI
 * USAGE:
 *  node create.js (with prompt for namespace name)
 *  node create.js {YOUR_NAMESPACE}
 */
global.THORIN_AUTO_LOAD = false;
const thorin = require('thorin'),
  prompt = require('prompt');

thorin
  .addStore(require('thorin-store-redis'), 'redis')
  .loadPath('app/lib/');
function doCreate(name) {
  const storeLib = thorin.lib('store');
  return storeLib.createNamespace({
    name: name
  }).then((r) => {
    console.log(`Namespace ${name} token: ${r.token}`);
  }).catch((e) => {
    if (e.ns === 'NAMESPACE') {
      log.error(name + ': ' + e.message);
      return process.exit(1);
    }
    thorin.exit(e);
  });
}

thorin.run((err) => {
  if (err) {
    return thorin.exit(err);
  }
  if (process.argv.length > 2) {
    let calls = [],
      names = process.argv.splice(2);
    names.forEach((name) => {
      if (name.trim() == '') return;
      calls.push(() => {
        return doCreate(name);
      });
    });
    return thorin.series(calls, (e) => {
      if (e) return;
      console.log(`Created ${names.length} namespaces`);
      process.exit(0);
    });
  }
  prompt.get({
    name: 'name',
    description: 'Namespace'
  }, (e, data) => {
    if (e) {
      console.log(`\nTerminating`);
      return process.exit(0);
    }
    doCreate(data.name).then(() => {
      process.exit(0);
    });
  });
});