'use strict';
/**
 * Web UI interface.
 */
const dispatcher = thorin.dispatcher;

process.nextTick(() => {

  /*
   * Landing and all SPA options here.
   * */
  dispatcher
    .addAction('ui.home')
    .alias('GET', '/ui')
    .alias('GET', '/ui/*')
    .authorize('ui.authenticated')
    .render('ui.html');

});

