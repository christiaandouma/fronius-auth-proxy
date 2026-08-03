#!/usr/bin/with-contenv bashio

export FRONIUS_HOSTNAME=$(bashio::config 'fronius_hostname')
export FRONIUS_PORT=$(bashio::config 'fronius_port')
export FRONIUS_USERNAME=$(bashio::config 'fronius_username')
export FRONIUS_PASSWORD=$(bashio::config 'fronius_password')
export FRONIUS_HTTPS=$(bashio::config 'fronius_https')
export FRONIUS_REJECT_UNAUTHORIZED=$(bashio::config 'fronius_reject_unauthorized')

bashio::log.info "Starting Fronius Auth Proxy on port 3000"
bashio::log.info "Targeting Fronius inverter at ${FRONIUS_HOSTNAME}:${FRONIUS_PORT}"

exec node /app/proxy.js
