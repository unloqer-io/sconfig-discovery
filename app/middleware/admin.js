'use strict';
const redisObj = thorin.store('redis'),
  dispatcher = thorin.dispatcher;

dispatcher
  .addTemplate('admin')
  .alias('/admin')
  .authorize('admin.token');

/**
 * Authorization functionality for admin requests.
 * All admin requests must contain a Bearer: {sconfigToken}
 */
dispatcher
  .addAuthorization('admin.token')
  .use((intentObj, next) => {
    const tokenType = intentObj.authorizationSource,
      accessToken = intentObj.authorization;
    if(tokenType !== 'TOKEN') {
      return next(thorin.error('AUTHORIZATION', 'Authorization method unsupported', 401));
    }
    const adminToken = thorin.config('admin.token');
    if(!thorin.util.compare(adminToken, accessToken)) {
      return next(thorin.error('AUTHORIZATION', 'Invalid authorization token', 401));
    }
    next();
  });