'use strict';
const dispatcher = thorin.dispatcher;
/**
 * This enables cluster nodes to store config that is available for
 * all nodes within the same cluster
 * This is not intended to store large or sensitive or 100% persistent data
 */
const MAX_CONFIG_SIZE = thorin.config('config.maxSize');
dispatcher
  .addAction('config.set')
  .template('registry')
  .debug(false)
  .alias('POST', '/config')
  .use((intentObj, next) => {
    const data = intentObj.rawInput,
      regEnv = intentObj.data('registry_env'),
      regToken = intentObj.data('token'),
      redis = thorin.store('redis');

    /* Check the config data, it must be under 10,000 chars */
    let rawData;
    try {
      rawData = JSON.stringify(data);
    } catch (e) {
      log.warn(`Received invalid config payload`);
      log.debug(data);
      return next(thorin.error('INVALID.DATA', 'Config data is not valid'));
    }
    if (rawData.length > MAX_CONFIG_SIZE) {
      return next(thorin.error('INVALID.DATA', 'Config data is too large'));
    }
    let calls = [];
    calls.push(() => {
      return redis.exec('SET', getKey(regEnv, regToken), rawData);
    });

    thorin.series(calls, (e) => {
      if(e) {
        log.warn(`Could not set config data`);
        log.debug(e);
        return next(e);
      }
      next();
    });
  });

/**
 * Returns the temporary configuration data previously set or empty object.
 * */
dispatcher
  .addAction('config.get')
  .template('registry')
  .debug(false)
  .alias('GET', '/config')
  .use((intentObj, next) => {
    const regEnv = intentObj.data('registry_env'),
      regToken = intentObj.data('token'),
      redis = thorin.store('redis');

    /* Check the config data, it must be under 10,000 chars */
    let calls = [];
    calls.push(() => {
      return redis.exec('GET', getKey(regEnv, regToken)).then((r) => {
        if(!r) return;
        try {
          r = JSON.parse(r);
        } catch(e) {
          return;
        }
        intentObj.result(r);
      });
    });

    thorin.series(calls, (e) => {
      if(e) {
        log.warn(`Could not get config data`);
        log.debug(e);
        return next(e);
      }
      next();
    });
  });



function getKey(env, token) {
  let key = thorin.util.sha2(env + '-' + token);
  return thorin.config('store.redis.prefix') + '.' + key;
}