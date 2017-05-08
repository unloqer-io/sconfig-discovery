'use strict';
/**
 * Web UI config setter/getter
 */
const dispatcher = thorin.dispatcher;

const DISCOVERY_KEY = process.env.DISCOVERY_KEY;

/**
 * Get configuration
 * */
dispatcher
  .addAction('ui.config.read')
  .authorize('ui.authenticated')
  .input({
    token: dispatcher.validate('STRING').default(null),
    version: dispatcher.validate('STRING').default(null)
  })
  .use((intentObj, next) => {
    let result = {
        token: DISCOVERY_KEY || null,
        data: null
      },
      input = intentObj.input(),
      store = thorin.lib('store'),
      calls = [];
    let configToken = input.token || DISCOVERY_KEY;
    if (input.version) {
      configToken += '#' + input.version;
    }
    if (configToken) {
      calls.push(() => {
        return store.getConfig(configToken).then((data) => {
          result.data = data;
          result.token = configToken;
          result.token = result.token.split('#')[0];
        });
      });
    }

    thorin.series(calls, (e) => {
      if (e) return next(e);
      intentObj.result(result);
      next();
    });
  });

/**
 * SAVE the configuration
 * */
dispatcher
  .addAction('ui.config.save')
  .authorize('ui.authenticated')
  .input({
    token: dispatcher.validate('STRING').default(null),
    version: dispatcher.validate('STRING').default(null),
    data: dispatcher.validate('JSON').error('DATA.INVALID', 'Missing configuration JSON')
  })
  .use((intentObj, next) => {
    let result = {},
      input = intentObj.input(),
      store = thorin.lib('store'),
      calls = [];
    let configToken = input.token || DISCOVERY_KEY;
    if (!configToken) return next(thorin.error('DATA.INVALID', 'Missing discovery token'));
    if (input.version) {
      configToken += '#' + input.version;
    }
    /* update data */
    calls.push(() => {
      return store.setConfig(configToken, input.data);
    });

    thorin.series(calls, (e) => {
      if (e) return next(e);
      next();
    });
  });
