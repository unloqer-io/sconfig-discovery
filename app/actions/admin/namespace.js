'use strict';
const redisObj = thorin.store('redis'),
  dispatcher = thorin.dispatcher;
/**
 * The administrator of the discovery system may add a namespace any time.
 * He however is required to use an sconfig.io authorization token.
 */

(() => {
  if (!thorin.config('admin.token')) return;
  log.trace(`Admin functions enabled`);

  /*
   * Create a namespace in the discovery engine. A namespace can be counted as an application, project,
   * or a cluster of common applications.
   * When a namespace is created, a unique identifier is created with it.
   * This is is the "project-id", and is used as the authorization key for the registry.
   * When this is stored, we sha2 it, and the original key is used to encrypt all the information
   * about any service within this namespace, so that the registry's db is zero-knowledge.
   * */
  const NAME_TYPE = dispatcher.validate('ALPHA', {
    dot: true,
    dash: true,
    underscore: true,
    numeric: true
  }).error('NAME_INVALID', 'Please enter the namespace name.');

  dispatcher
    .addAction('admin.namespace.create')
    .template('admin')
    .alias('POST', '/namespace')
    .input({
      name: NAME_TYPE
    })
    .use((intentObj, next) => {
      const storeObj = thorin.lib('store');
      storeObj
        .createNamespace(intentObj.input())
        .then((data) => {
          intentObj.result(data).send();
        }).catch(next);
    });

  /*
   * Completely remove a namespace from the storage.
   * */
  dispatcher
    .addAction('admin.namespace.delete')
    .template('admin')
    .alias('DELETE', '/namespace')
    .input({
      name: NAME_TYPE
    })
    .use((intentObj, next) => {
      const storeObj = thorin.lib('store');
      storeObj
        .deleteNamespace(intentObj.input('name'))
        .then(() => next())
        .catch(next);
    });


})();