'use strict';
const dispatcher = thorin.dispatcher;
/**
 * This contains all functionality required by the registry
 * to work with services, including the heartbeat, service registration and such.
 */
/*
 * Returns the state of the registry.
 * */
let reqCount = 0;
setInterval(() => {
  if (reqCount === 0) return;
  let reqPerSec = parseFloat(reqCount / 3600).toFixed(2);
  log.info(`Registry requests per hour: ${reqCount} [${reqPerSec}/sec]`);
  reqCount = 0;
}, 60 * 60 * 1000); // once an hour, we reset the request count.


dispatcher
  .addAction('registry.get')
  .template('registry')
  .debug(false)
  .input({
    type: dispatcher.validate('STRING').default(null),
    tags: dispatcher.validate('ARRAY', {type: 'string'}).default(null)
  })
  .alias('GET', '/registry')
  .use('registry.saveChanges')
  .use((intentObj, next) => {
    const registry = intentObj.data('registry'),
      storeObj = thorin.lib('store'),
      accessToken = intentObj.data('token'),
      resultData = [],
      regEnv = intentObj.data('registry_env'),
      filterType = intentObj.input('type'),
      filterTags = intentObj.input('tags'),
      filterTagMap = {};
    if (filterTags) {
      for (let j = 0; j < filterTags.length; j++) {
        filterTagMap[filterTags[j]] = true;
      }
    }
    for (let i = 0, len = registry.length; i < len; i++) {
      let item = registry[i];
      if (filterType && item.type !== filterType) continue;
      if (filterTags) {
        let isTagFound = false;
        for (let j = 0; j < item.tags.length; j++) {
          if (filterTagMap[item.tags[j]]) {
            isTagFound = true;
            break;
          }
        }
        if (!isTagFound) continue;
      }
      if (item.env !== regEnv) continue;
      delete item.id;
      delete item.remove_at;
      delete item.env;
      resultData.push(item);
    }
    let calls = [];

    calls.push(() => {
      return storeObj.getServiceKey(accessToken).then((serviceKey) => {
        intentObj.setMeta({
          service_key: serviceKey
        });
      });
    });
    thorin.series(calls, (e) => {
      if (e) return next(e);
      intentObj.result(resultData);
      intentObj.send();
      reqCount++;
    });
  });

/*
 * Registers a new service to the registry.
 * Note that services are unique by their host:port.
 * */
dispatcher
  .addAction('registry.announce')
  .template('registry')
  .alias('POST', '/announce')
  .debug(false)
  .input({
    type: dispatcher.validate('STRING').error('TYPE.MISSING', 'Missing microservice type', 400),
    name: dispatcher.validate('STRING').default(null),  // the microservice name.
    host: dispatcher.validate('STRING').error('HOST.MISSING', 'Missing microservice host address', 400),
    proto: dispatcher.validate('ENUM', ['http', 'https']).default('http'),
    timeout: dispatcher.validate('NUMBER', {min: 100}).default(null),
    port: dispatcher.validate('NUMBER', {
      float: false,
      min: 1,
      max: 65536
    }).error('PORT.MISSING', 'Missing microservice port', 400),
    path: dispatcher.validate('STRING').default(''), // the default host path
    tags: dispatcher.validate('ARRAY', {type: 'string'}).default([]),
    ttl: dispatcher.validate('NUMBER', {min: 1, max: 120}).default(30)  // default TTL of the service before we remove it, in seconds
  })
  .use((intentObj, next) => {
    const serviceData = intentObj.input(),
      accessToken = intentObj.data('token'),
      serviceId = serviceData.host + ':' + serviceData.port,
      registryData = intentObj.data('registry'),
      storeObj = thorin.lib('store');
    serviceData.env = intentObj.data('registry_env');
    if (serviceData.timeout == null) delete serviceData.timeout;
    let wasFound = false, sid;
    // Step one, check if the registry already contains the new service host:port
    for (let i = 0, len = registryData.length; i < len; i++) {
      let item = registryData[i];
      if (item.id === serviceId && item.env === intentObj.data('registry_env')) {
        wasFound = true;
        sid = item.sid;
        // override any data
        item.tags = serviceData.tags;
        item.ttl = serviceData.ttl;
        if (serviceData.name) item.name = serviceData.name;
        if (serviceData.type !== item.type) item.type = serviceData.type;
        // update the remove_at ts.
        item.remove_at = Date.now() + serviceData.ttl * 1000;
        break;
      }
    }
    // If we did not find it, we push it.
    if (!wasFound) {
      serviceData.remove_at = Date.now() + serviceData.ttl * 1000;
      serviceData.id = serviceId; // this is the host:port id
      serviceData.sid = thorin.util.sha1(thorin.util.randomString(32) + serviceData.id); // this is the heartbeat id
      sid = serviceData.sid;
      registryData.push(serviceData);
    }
    let calls = [],
      serviceKey;
    // step one, update the registry
    calls.push(() => {
      return storeObj.saveRegistry(accessToken, registryData);
    });
    // next, fetch the service shared key.
    calls.push(() => {
      return storeObj.getServiceKey(accessToken).then((key) => {
        serviceKey = key;
      });
    });
    thorin.series(calls, (err) => {
      if (err) return next(err);
      let resultData = [];
      // finally, we will return the entire registry.
      for (let i = 0, len = registryData.length; i < len; i++) {
        let item = registryData[i];
        if (item.env !== intentObj.data('registry_env')) continue;
        delete item.env;
        delete item.id;
        delete item.remove_at;
        resultData.push(item);
      }
      intentObj.result(resultData);
      intentObj.setMeta({
        sid: sid,
        service_key: serviceKey
      });
      reqCount++;
      next();
    });
  });

/*
 * Manually leave the registry
 * */
dispatcher
  .addAction('registry.leave')
  .template('registry')
  .alias('POST', '/leave')
  .input({
    sid: dispatcher.validate('STRING').error('SID.MISSING', 'Missing sid')
  })
  .use((intentObj, next) => {
    const sid = intentObj.input('sid'),
      registry = intentObj.data('registry'),
      accessToken = intentObj.data('token'),
      env = intentObj.data('registry_env'),
      storeObj = thorin.lib('store');

    // check if we remove it.
    let wasFound = false;
    for (let i = 0, len = registry.length; i < len; i++) {
      let item = registry[i];
      if (item.env !== env) continue;
      if (item.sid === sid) {
        registry.splice(i, 1);
        wasFound = true;
        break;
      }
    }
    if (!wasFound) {
      return intentObj.send();
    }
    storeObj
      .saveRegistry(accessToken, registry)
      .then(() => intentObj.send())
      .catch((e) => next(e));
  });