'use strict';
if (typeof process.env.BOOT_TIMEOUT === 'undefined') {
  require('./start.js');
} else {
  let sec = parseInt(process.env.BOOT_TIMEOUT);
  if (typeof sec === 'number' && sec > 0) {
    console.log('Booting up system in ' + sec + ' seconds');
    setTimeout(() => {
      require('./start.js');
    }, sec * 1000);
  } else {
    console.debug(`Boot timer is not a number`);
    require('./start.js');
  }
}