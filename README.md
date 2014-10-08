Planbook, Revision 4
==============
4rd version of the planbook! First was Java, Second was Python, now fully in Node and Javascript, with no CSS framework!


## How to Install

1. install [node.js](http://nodejs.org/).
2. install [couchdb](http://couchdb.apache.org/).
1. `git clone` the repo into a directory.
2. run `npm update` inside the directory, it will download all the dependencies (express, nano, and cookie).
4. move/symlink `local.ini` into `/usr/local/etc/couchdb/`.
5. start couchdb.
6. run `node app.js [port]`.
7. open your browser to `http://localhost:[port]`.