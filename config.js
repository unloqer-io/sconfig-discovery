'use strict';
/**
 * Creates a new discovery namespace from the CLI
 * USAGE:
 *  node create.js (with prompt for namespace name)
 *  node create.js {YOUR_NAMESPACE}
 */
global.THORIN_AUTO_LOAD = false;
const thorin = require('thorin'),
  prompt = require('prompt'),
  dot = require('dot-object');

thorin
  .addStore(require('thorin-store-redis'), 'redis')
  .loadPath('app/lib/');

function doClear(token, keyName) {
  let store = thorin.lib('store');
  let calls = [],
    result = {};

  calls.push(() => {
    return store.getConfig(token).then((r) => result = r);
  });

  calls.push(() => {
    if (!keyName) {
      result = {};
    } else {
      dot.del(keyName, result);
    }
    return store.setConfig(token, result);
  });

  thorin.series(calls, (e) => {
    if (e) {
      console.error(`Error: ${e.message}`);
      return process.exit(1);
    }
    console.log(`Clear: ` + (keyName || '*all*'));
    process.exit(0);
  });
}

function doGet(token, keyName) {
  let store = thorin.lib('store');
  return store.getConfig(token).then((data) => {
    if (!keyName) {
      console.log(JSON.stringify(data, null, 2));
      return process.exit(0);
    }
    let rawValue = null;
    try {
      rawValue = dot.pick(keyName, data);
      if (rawValue === undefined) rawValue = null;
    } catch (e) {
    }
    console.log(JSON.stringify(rawValue, null, 2));
    process.exit(0);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

function doSet(token, keyName, keyValue) {
  let store = thorin.lib('store');
  let calls = [],
    config = {};
  let nr = /^\d+$/;
  if (keyValue === 'true') {
    keyValue = true;
  } else if (keyValue === 'false') {
    keyValue = false;
  } else {
    // check number only
    if (nr.test(keyValue)) {
      keyValue = parseInt(keyValue);
    } else if (keyValue.indexOf('[') !== -1 || keyValue.indexOf('{') !== -1) {
      try {
        keyValue = JSON.parse(keyValue);
      } catch (e) {
        console.error('Invalid JSON for key value: ', keyValue);
        return process.exit(1);
      }
    } else if (keyValue.indexOf(',') !== -1) {
      keyValue = keyValue.split(',');
      for (let i = 0; i < keyValue.length; i++) {
        keyValue[i] = keyValue[i].trim();
        if (nr.test(keyValue[i])) {
          keyValue[i] = parseInt(keyValue[i]);
        } else if (keyValue[i] === 'true') {
          keyValue[i] = true;
        } else if (keyValue[i] === 'false') {
          keyValue[i] = false;
        }
      }
    }
  }
  calls.push(() => {
    return store.getConfig(token).then((r) => config = r);
  });
  calls.push(() => {
    dot.del(keyName, config);
    dot.str(keyName, keyValue, config);
    return store.setConfig(token, config);
  });
  thorin.series(calls, (e) => {
    if (e) {
      console.error(`Error: ${e.message}`);
      return process.exit(1);
    }
    console.log(`Set: ` + keyName + ' => ' + JSON.stringify(keyValue));
    process.exit(0);
  });
}

thorin.run((err) => {
  if (err) {
    return thorin.exit(err);
  }
  if (!process.env.DISCOVERY_KEY) {
    console.error(`Config viewer requires DISCOVERY_KEY environment variable`);
    return process.exit(1);
  }
  let args = process.argv.splice(2),
    cmd = args[0];
  args = args.splice(1);
  if (cmd !== 'get' && cmd !== 'set' && cmd !== 'clear' && cmd !== 'del') {
    console.error(`Usage: node config {set|get|clear|del} {key} {value}`);
    return process.exit(1);
  }
  let keyName = args[0],
    token = process.env.DISCOVERY_KEY,
    keyValue = args[1];
  if (cmd === 'set' && !keyName) {
    console.error(`Usage: node config set key {value}`);
    return process.exit(1);
  }
  /* CLEAR config (key) */
  if (cmd === 'clear' || cmd === 'del') {
    return doClear(token, keyName);
  }

  /* GET config (key) */
  if (cmd === 'get') {
    return doGet(token, keyName);
  }

  let tmp = keyName.split('.');
  keyName = [];
  for (let i = 0; i < tmp.length; i++) {
    if (tmp[i].trim() == '') continue;
    keyName.push(tmp[i]);
  }
  keyName = keyName.join('.');
  if (!keyName) {
    console.error(`Config key is not valid`);
    return process.exit(1);
  }
  args = args.splice(1);  // remove the keyName
  if (typeof keyValue === 'undefined') {
    return prompt.get({
      name: 'value',
      description: 'Value'
    }, (e, data) => {
      if (!data.value) {
        console.log(`Abort`);
        return process.exit(0);
      }
      if (e) {
        console.log(`\nTerminating`);
        return process.exit(0);
      }
      return doSet(token, keyName, data.value);
    })
  }

  keyValue = args.join(' ');
  keyValue = keyValue.trim();
  return doSet(token, keyName, keyValue);
});