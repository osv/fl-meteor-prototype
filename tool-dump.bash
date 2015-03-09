#!/bin/bash

# Дамп аплоадов и базы в файл.
# потом можно импортировать скриптом tool-restore.bash

BASEDIR=$(dirname $0)

if [ -z $1 ]; then
    echo "Dump moldavan"
    echo "Usage: $0 dumpfile"
    exit
fi

DUMPFILE=$1

TMPDIR="/tmp/moldavanexport"
MONGOPATH=$BASEDIR/.meteor/local/db/

# clean old tmp
rm -rf $TMPDIR

# dump mongodb
# mongodump -h 127.0.0.1 --port 3001 -d meteor -o $TMPDIR/mongo
mongodump --dbpath $MONGOPATH -d meteor -o $TMPDIR/mongo

# dump uploads
cp -r $BASEDIR/.meteor/local/uploads $TMPDIR/

tar -C $TMPDIR -cvzf $DUMPFILE .

echo "cleanning tmp files"
rm -rf $TMPDIR
echo "Done exporting into file $DUMPFILE"
