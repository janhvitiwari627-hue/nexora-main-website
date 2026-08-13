#!/bin/sh
set -eu
npm --prefix template-app ci --ignore-scripts
npm --prefix template-app run build
rm -rf public/template-app
mkdir -p public/template-app
cp -R template-app/dist/. public/template-app/
rm -f public/template-app/server.cjs public/template-app/server.cjs.map
test -f public/template-app/index.html
