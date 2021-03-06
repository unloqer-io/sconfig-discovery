FROM snupa/node

# --- Environment variables

# The port the server will bind to
ENV PORT 18000
ENV NODE_ENV production

# If the discovery key is set, it will automatically create if not exists a namespace with the given discovery key to be used automatically.
#ENV DISCOVERY_KEY none

# If the admin token is set, the admin API endpoints will be exposed and available.
#ENV ADMIN_TOKEN none

# You can also set a list of admin e-mails that will have access to the UI (comma-delimited)
#ENV ADMIN_EMAIL none

# Set this to true to enable the admin UI
#ENV ADMIN_UI none

# If you want to host your config on sconfig.io, place the key/secret combo here.
#ENV SCONFIG_KEY none
#ENV SCONFIG_SECRET none

# If you want to debug your discovery instance with loglet.io, place your key/secret combo here.
#ENV LOGLET_KEY none
#ENV LOGLET_SECRET none

# The redis connection information will be storedhere
#ENV REDIS_HOST localhost
#ENV REDIS_SENTINEL
#ENV REDIS_PORT 6379
#ENV REDIS_PASSWORD none
#ENV REDIS_PREFIX none
#ENV REDIS_CLUSTERED true // If set to true, we will set store.redis.clustered = true

# --- Configure the app as the node user
WORKDIR /$user/src/app
COPY . /$user/src/app
RUN npm install -qp
RUN chown -R $user:$user /$user/src/app/
USER $user

ENTRYPOINT [ "node", "launch.js" ]
