'use strict';
const redisObj = thorin.store('redis'),
  logger = thorin.logger('store'),
  DEFAULT_TOKEN_ENVIRONMENT = 'development';

function getKey(key) {
  return getPrefix() + '.' + key;
}
function getPrefix() {
  return thorin.config('store.redis.prefix');
}

function getTokenEnv(token) {
  token = token.replace(/ /g, '');
  let idx = token.indexOf('-'),
    env,
    t;
  if (idx === -1) {
    env = DEFAULT_TOKEN_ENVIRONMENT;
    t = token;
  } else {
    env = token.substr(0, idx);
    t = token.substr(idx + 1);
  }
  if(env.length > 12) {
    env = env.substr(0, 12);
  }
  return {
    env: env,
    token: t
  };
}

/*
 * This is the store that we use to store all the information.
 * This works as an abstraction layer between the app and redis.
 * It will in term use the redis store
 * */

class RegistryStore {

  createNamespace(data) {
    return new Promise((resolve, reject) => {
      let secretKey = thorin.util.randomString(32),
        publicKey = thorin.util.randomString(16),
        fullKey = secretKey + publicKey,
        hashKey = thorin.util.sha2(fullKey),
        calls = [];
      // Check if ns exists
      calls.push((stop) => {
        return redisObj.exec('HGET', getKey('namespace'), data.name).then((r) => {
          if (r) return stop(thorin.error('NAMESPACE.EXISTS', 'A namespace with that name already exists.'));
        });
      });

      // Create the ns
      calls.push(() => {
        const nsData = {
          token_hash: hashKey
        };
        return redisObj.exec('HSET', getKey('namespace'), data.name, JSON.stringify(nsData));
      });

      // create the shared service key
      calls.push(() => {
        let serviceKey = thorin.util.randomString(48);
        serviceKey = thorin.util.encrypt(serviceKey, secretKey);
        return redisObj.exec('HSET', getKey('service_key'), hashKey, serviceKey);
      });

      // Create the empty namespace registry.
      calls.push(() => {
        let registryData = JSON.stringify([]);
        registryData = thorin.util.encrypt(registryData, secretKey);
        if (!registryData) throw thorin.error('NAMESPACE.ERROR', 'Could not create registry.', 500);
        return redisObj.exec('HSET', getKey('registry'), hashKey, registryData);
      });

      thorin.series(calls, (e) => {
        if (e) {
          if(e.ns !== 'NAMESPACE') {
            logger.warn(`Failed to create namespace ${data.name}`, e);
          }
          return reject(e);
        }
        resolve({
          token: fullKey
        });
      });
    });
  }

  /*
   * Completely removes a namespace, its key and the registry from redis
   * */
  deleteNamespace(name) {
    return new Promise((resolve, reject) => {
      let calls = [],
        nsData = null;

      /* read the namespace */
      calls.push((stop) => {
        return redisObj.exec('HGET', getKey('namespace'), name).then((r) => {
          if (!r || r == '') return stop(thorin.error('NAMESPACE.NOT_FOUND', 'The requested namespace does not exist.', 404));
          try {
            nsData = JSON.parse(r);
          } catch (e) {
            logger.warn(`Could not parse namespace ${name} data on delete`, r);
            return stop(thorin.error('NAMESPACE.DATA', 'Could not delete namespace', 500, e));
          }
        });
      });

      /* delete the ns and its registry */
      calls.push(() => {
        return redisObj.exec('HDEL', getKey('namespace'), name);
      });
      calls.push(() => {
        return redisObj.exec('HDEL', getKey('registry'), nsData.token_hash);
      });
      // delete the service key
      calls.push(() => {
        return redisObj.exec('HDEL', getKey('service_key'), nsData.token_hash);
      });

      thorin.series(calls, (e) => {
        if (e) {
          if (e.ns !== 'NAMESPACE') {
            logger.warn(`Could not remove namespace ${name}`, e);
          }
          return reject(e);
        }
        resolve();
      });
    });
  }

  /*
  * Resets the service key of a namespace.
  * */
  resetServiceKey(token) {
    return new Promise((resolve, reject) => {
      const calls = [],
        hashKey = thorin.util.sha2(token);

      // step one, fetch the key hash of the namespace.
      calls.push((stop) => {
        return redisObj.exec('HGET', getKey('service_key'), hashKey).then((r) => {
          if(!r) return stop(thorin.error('TOKEN.NOT_FOUND', 'Token not found or invalid.', 404));
        });
      });

      // if it exists, update it.
      calls.push(() => {
        let serviceKey = thorin.util.randomString(48),
          secretKey = token.substr(0, 32);
        serviceKey = thorin.util.encrypt(serviceKey, secretKey);
        return redisObj.exec('HSET', getKey('service_key'), hashKey, serviceKey);
      });

      thorin.series(calls, (e) => {
        if(e) return reject(e);
        resolve();
      });
    });
  }

  /*
   * Returns the associated registry data of the token.
   * */
  getRegistry(token) {
    return new Promise((resolve, reject) => {
      let regEnv = getTokenEnv(token);
      const tokenHash = thorin.util.sha2(regEnv.token);
      redisObj.exec('HGET', getKey('registry'), tokenHash, (err, regData) => {
        if (err) {
          logger.warn(`Could not check if registry token exists.`, err);
          return reject(err);
        }
        if (!regData) {
          return reject(thorin.error('REGISTRY.NOT_FOUND', 'Requested registry does not exist.', 404));
        }
        const secretKey = regEnv.token.substr(0, 32);
        try {
          regData = thorin.util.decrypt(regData, secretKey);
          if (!regData) throw 1;
          regData = JSON.parse(regData);
        } catch (e) {
          logger.warn(`Could not parse registry data for token ${token}`);
          return reject(thorin.error('REGISTRY.DATA', 'Could not parse registry data.', 500));
        }
        // For each service in the registry, check if its ttl was achieved. If it was, we remove it.
        let i = 0,
          hasChanged = false,
          now = Date.now();
        while (i < regData.length) {
          let item = regData[i];
          if (item.remove_at <= now) {
            if (!hasChanged) hasChanged = true;
            regData.splice(i, 1);
          } else {
            i++;
          }
        }
        resolve({
          registry: regData,
          changed: hasChanged,
          token: regEnv.token,
          env: regEnv.env
        });
      });
    });
  }

  /*
   * Updates the registry.
   * */
  saveRegistry(token, registryData) {
    return new Promise((resolve, reject) => {
      const tokenHash = thorin.util.sha2(token),
        secretKey = token.substr(0, 32);

      let regData = JSON.stringify(registryData);
      regData = thorin.util.encrypt(regData, secretKey);
      if (!regData) {
        logger.warn(`Could not encrypt registry data for token ${token}`);
        return reject(thorin.error('REGISTRY.ERROR', 'Could not update registry', 500));
      }
      redisObj.exec('HSET', getKey('registry'), tokenHash, regData, (err) => {
        if (err) {
          logger.warn(`Could not store registry for token ${token} to redis.`);
          logger.debug(err);
          return reject(err);
        }
        resolve();
      });
    });
  }

  /*
   * Returns the registry service key.
   * */
  getServiceKey(token) {
    return new Promise((resolve, reject) => {
      const secretKey = token.substr(0, 32),
        hashKey = thorin.util.sha2(token);
      // create the shared service key
      redisObj.exec('HGET', getKey('service_key'), hashKey, (err, encryptedServiceKey) => {
        if (err) return reject(err);
        let serviceKey;
        try {
          if (!encryptedServiceKey) throw 1;
          serviceKey = thorin.util.decrypt(encryptedServiceKey, secretKey);
          if (!serviceKey) throw 1;
        } catch (e) {
          return reject(thorin.error('SERVICE.KEY', 'Could not parse shared service key', 500));
        }
        resolve(serviceKey);
      });
    });
  }
}

thorin.addLibrary(RegistryStore, 'store');