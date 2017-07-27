'use strict';
/**
 * AUTH endpoints for our UI
 */
const dispatcher = thorin.dispatcher;
const apiObj = thorin.fetcher('api', 'https://api.unloq.io/api');
const ADMINS = thorin.config('admin.emails') || [];
/*
 * Check session
 * */
dispatcher
  .addAction('ui.login.check')
  .authorize('ui.authenticated');


/*
 * Perform UNLOQ auth
 * */
dispatcher
  .addAction('ui.login.unloq')
  .input({
    token: dispatcher.validate('STRING', {min: 100}).error('DATA.INVALID', 'Missing auth token')
  })
  .use((intentObj, next) => {
    let calls = [],
      user = null,
      input = intentObj.input();

    /* Check token */
    calls.push(() => {
      return apiObj.dispatch('api.application.approval.global', {
        token: input.token
      }).then((res) => {
        user = res.result;
      });
    });

    /* Next, check if we have this user as a discovery user. */
    calls.push((stop) => {
      if (ADMINS.indexOf(user.email) === -1) {
        return stop(thorin.error('AUTH.USER', 'User does not have access.'));
      }
      intentObj.session.is_authenticated = true;
      intentObj.session.user = user;
    });


    thorin.series(calls, (e) => {
      if (e) return next(e);
      if (user) {
        log.info(`User ${user.email} logged in`);
      }
      next();
    });
  });


/*
 * Logs out
 * */
dispatcher
  .addAction('ui.login.logout')
  .use((intentObj, next) => {
    intentObj.session.destroy();
    next();
  });
