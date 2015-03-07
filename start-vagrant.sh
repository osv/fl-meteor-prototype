#!/bin/sh
# script for running meteor inside vagrant

BASEDIR=$(dirname $0)

echo "Mount .meteor/local"
mkdir -p ~/moldavanmock/local
mkdir -p ./.meteor/local
sudo mount --bind /home/vagrant/moldavanmock/local $BASEDIR/.meteor/local

echo "Mount packages/mol-uploads/.npm/package"
mkdir -p ~/moldavanmock/npm/mol-uploads
mkdir -p ./packages/mol-uploads/.npm
sudo mount --bind /home/vagrant/moldavanmock/npm/mol-uploads $BASEDIR/packages/mol-uploads/.npm

echo "Start meteor"
cd $BASEDIR
meteor
