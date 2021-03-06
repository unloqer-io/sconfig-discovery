'use strict';
const dispatcher = thorin.dispatcher;
/**
 * This enables cluster nodes to store config that is available for
 * all nodes within the same cluster
 * This is not intended to store large or sensitive or 100% persistent data
 */

dispatcher
  .addAction('config.set')
  .template('registry')
  .debug(false)
  .alias('POST', '/config')
  .input({
    v: dispatcher.validate('STRING').default(null)
  })
  .use((intentObj, next) => {
    let data = intentObj.rawInput,
      regToken = intentObj.data('token'),
      store = thorin.lib('store');

    if (data.v) {
      regToken += '#' + data.v;
    }
    delete data.v;
    store.setConfig(regToken, data).then(() => next()).catch((e) => next(e));
  });

/**
 * Returns the temporary configuration data previously set or empty object.
 * */
dispatcher
  .addAction('config.get')
  .template('registry')
  .debug(false)
  .alias('GET', '/config')
  .input({
    v: dispatcher.validate('STRING').default(null)
  })
  .use((intentObj, next) => {
    let regToken = intentObj.data('token'),
      input = intentObj.input(),
      store = thorin.lib('store');
    if (input.v) {
      regToken += '#' + input.v;
    }
    store.getConfig(regToken).then((data) => {
      intentObj.rawResult(JSON.stringify(data || {}));
      intentObj.resultHeaders('content-type', 'application/json');
      next();
    }).catch((e) => {
      next(e)
    });
  });


function getKey(token) {
  let key = thorin.util.sha2(token);
  return thorin.config('store.redis.prefix') + '.config' + key;
}