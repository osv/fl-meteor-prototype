#!/bin/bash

# Скрипт востановления базы и аплоадов
# с файла сгенерированым tool-restore.bash скриптом 

BASEDIR=$(dirname $0)

if [ -z $1 ]; then
    echo "Restore moldavan"
    echo "Usage: $0 dumpfile"
    exit
fi

DUMPFILE=$1
UPLOADDIR="$BASEDIR/.meteor/local/uploads"
TMPDIR="/tmp/moldavanimport"
MONGOPATH="$BASEDIR/.meteor/local/db"

# # clean old restore data
rm -rf $TMPDIR
mkdir -p $TMPDIR
tar -C $TMPDIR/ -xf $DUMPFILE 

mkdir -p $MONGOPATH
mongorestore --dbpath $MONGOPATH --drop  $TMPDIR/mongo
echo "DB restored."

mkdir -p $UPLOADDIR
echo "Coping files"
cp -r $TMPDIR/uploads/* $UPLOADDIR
FILES=$(find $TMPDIR/uploads/ -type f | wc -l)
echo "Importing finished."
echo "          uploads: $FILES files"
rm -rf $TMPDIR
