'use strict';
const dispatcher = thorin.dispatcher;

dispatcher
  .addAction('home')
  .alias('GET', '/')
  .use((intentObj) => {
    intentObj.result({
      version: thorin.version
    }).send();
  });

dispatcher
  .addAction('ping')
  .alias('GET', '/ping')
  .use((intentObj) => {
    intentObj.result({
      pong: true
    }).send();
  });