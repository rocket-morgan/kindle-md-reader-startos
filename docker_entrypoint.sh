#!/bin/bash
set -e
trap "exit 0" SIGTERM SIGINT
exec node server.js
