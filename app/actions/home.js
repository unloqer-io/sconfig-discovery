'use strict';
const dispatcher = thorin.dispatcher;

dispatcher
  .addAction('home')
  .alias('GET', '/')
  .debug(false)
  .use((intentObj) => {
    intentObj.result({
      version: thorin.version
    }).send();
  });

dispatcher
  .addAction('ping')
  .alias('GET', '/ping')
  .debug(false)
  .use((intentObj) => {
    intentObj.result({
      pong: true
    }).send();
  });