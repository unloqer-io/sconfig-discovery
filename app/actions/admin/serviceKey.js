'use strict';
const dispatcher = thorin.dispatcher;
/**
 * Created by Adrian on 29-Jun-16.
 */
/*
 * Resets the service key of a given namespace.
 * */
dispatcher
  .addAction('admin.service_key.reset')
  .template('admin')
  .alias('POST', '/service-key/reset')
  .input({
    token: dispatcher.validate('STRING').error('TOKEN.MISSING', 'Missing namespace token')
  })
  .use((intentObj, next) => {
    const storeObj = thorin.lib('store');

    storeObj
      .resetServiceKey(intentObj.input('token'))
      .then(() => next())
      .catch(next);
  });