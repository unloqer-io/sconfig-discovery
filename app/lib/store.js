'use strict';
const redisObj = thorin.store('redis'),
  logger = thorin.logger('store'),
  DEFAULT_TOKEN_ENVIRONMENT = 'development';
const MAX_CONFIG_SIZE = thorin.config('config.maxSize');

function getKey(key) {
  return getPrefix() + '.' + key;
}
function getPrefix() {
  return thorin.config('store.redis.prefix');
}

function getConfigKey(token) {
  let hash = thorin.util.sha2(token),
    tmp = hash.substr(0, 32) + token;
  token = thorin.util.sha2(tmp);
  return getKey('config.' + token);
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
  if (env.length > 12) {
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

  bootNamespace(token) {
    let calls = [],
      nsKey = getKey('boot.ns'),
      isAdded = false,
      nsHash = thorin.util.sha2(token);
    if (token.length < 48) {
      return Promise.reject(thorin.error('TOKEN.LENGTH', 'The discovery token must have at least 48 chars'));
    }
    /* check if boot namespace token already exists */
    calls.push((stop) => {
      return redisObj.exec('GET', nsKey).then((r) => {
        if (r && r === nsHash) return stop();
      });
    });

    /* create a default namespace. */
    calls.push(() => {
      return this.createNamespace({
        name: 'main-store'
      }, token).then(() => {
        isAdded = true;
      });
    });

    /* save the ns */
    calls.push(() => {
      return redisObj.exec('SET', nsKey, nsHash);
    });

    return thorin.series(calls).then(() => {
      return isAdded;
    });
  }

  createNamespace(data, _fullKey) {
    return new Promise((resolve, reject) => {
      let secretKey = thorin.util.randomString(32),
        publicKey = thorin.util.randomString(16),
        fullKey = secretKey + publicKey,
        hashKey = thorin.util.sha2(fullKey),
        calls = [];
      if (_fullKey) { //override the random keys
        secretKey = _fullKey.substr(0, 32);
        fullKey = _fullKey;
        hashKey = thorin.util.sha2(fullKey);
      }

      // Check if ns exists
      calls.push((stop) => {
        if (_fullKey) return;
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
          if (e.ns !== 'NAMESPACE') {
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
          if (!r) return stop(thorin.error('TOKEN.NOT_FOUND', 'Token not found or invalid.', 404));
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
        if (e) return reject(e);
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

  /*
   * Sets/gets encrypted config
   * */
  setConfig(token, data) {
    let calls = [],
      secretToken = token.substr(0, 32);
    /* Check the config data, it must be under 10,000 chars */
    let rawData;
    try {
      rawData = JSON.stringify(data);
      if (rawData.length > MAX_CONFIG_SIZE) {
        return Promise.reject(thorin.error('INVALID.DATA', 'Config data is too large'));
      }
      rawData = thorin.util.encrypt(rawData, secretToken);
      if (!rawData) throw new Error('Config data could not be encrypted');
    } catch (e) {
      logger.warn(`Received invalid config payload`);
      logger.debug(data);
      return Promise.reject(thorin.error('INVALID.DATA', 'Config data is not valid'));
    }
    calls.push(() => {
      return redisObj.exec('SET', getConfigKey(token), rawData);
    });

    return thorin.series(calls);
  }

  getConfig(token) {
    let calls = [],
      result = {},
      secretToken = token.substr(0, 32);

    calls.push(() => {
      return redisObj.exec('GET', getConfigKey(token)).then((r) => {
        if (!r) return;
        try {
          r = thorin.util.decrypt(r, secretToken);
        } catch (e) {
          return;
        }
        try {
          r = JSON.parse(r);
        } catch (e) {
          return;
        }
        result = r;
      });
    });
    return thorin.series(calls).then(() => {
      return result;
    });
  }
}


thorin.addLibrary(RegistryStore, 'store');