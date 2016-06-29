'use strict';
const dispatcher = thorin.dispatcher;

dispatcher
  .addTemplate('registry')
  .alias('/')
  .authorization('registry.token');

/**
 * The registry middleware performs token authorization
 * and places the token secret key in the intent, so that we can
 * decrypt data stored in redis.
 */
dispatcher
  .addAuthorization('registry.token')
  .use((intentObj, next) => {
    const tokenType = intentObj.authorizationSource,
      accessToken = intentObj.authorization;
    if (tokenType !== 'TOKEN') {
      return next(thorin.error('AUTHORIZATION', 'Authorization method unsupported', 401));
    }
    const storeObj = thorin.lib('store');
    storeObj.getRegistry(accessToken).then((regData) => {
      intentObj.data('registry', regData.registry);
      intentObj.data('registry_changed', regData.changed);
      intentObj.data('registry_env', regData.env);
      intentObj.data('token', regData.token);
      next();
    }).catch(next);
  });

/*
 * This is called when we want to persist a registry that has changed.
 * */
dispatcher
  .addMiddleware('registry.saveChanges')
  .use((intentObj, next) => {
    let hasChanged = intentObj.data('registry_changed');
    if (!hasChanged) return next();
    let token = intentObj.data('token'),
      registry = intentObj.data('registry'),
      storeObj = thorin.lib('store');
    storeObj.saveRegistry(token, registry)
      .then(() => next())
      .catch((e) => {
        log.warn('Could not persist registry changes in registry.saveChanges');
        log.debug(e);
        next();
      });
  });