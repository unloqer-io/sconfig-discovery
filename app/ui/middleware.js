'use strict';
/**
 * Web middleware
 */

const dispatcher = thorin.dispatcher;

const AUTH_ERROR = thorin.error('AUTH.EXPIRED', 'Session expired', 401);

dispatcher
  .addAuthorization('ui.authenticated')
  .use((intentObj, next) => {
    const sessionObj = intentObj.session;
    if (sessionObj.is_authenticated === true) return next();
    if (intentObj.isAjax()) {
      return next(AUTH_ERROR);
    }
    intentObj.redirect('/');
    next();
  });
