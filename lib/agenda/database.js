'use strict';
const Datastore = require('nedb');
const debug = require('debug')('agenda:database');
const path = require('path');

/**
 * Connect to the spec'd MongoDB server and database.
 * @name Agenda#database
 * @function
 * @param {String} file MongoDB server URI
 * @param {String} collection name of collection to use. Defaults to `agendaJobs`
 * @param {Object} options options for connecting
 * @param {Function} cb callback of MongoDB connection
 * @returns {exports}
 * NOTE:
 * If `url` includes auth details then `options` must specify: { 'uri_decode_auth': true }. This does Auth on
 * the specified database, not the Admin database. If you are using Auth on the Admin DB and not on the Agenda DB,
 * then you need to authenticate against the Admin DB and then pass the MongoDB instance into the constructor
 * or use Agenda.mongo(). If your app already has a MongoDB connection then use that. ie. specify config.mongo in
 * the constructor or use Agenda.mongo().
 */
module.exports = function (filename, collection, options, cb) {
  const self = this;

  collection = collection || 'agendaJobs';
  // options = Object.assign({autoReconnect: true, reconnectTries: Number.MAX_SAFE_INTEGER, reconnectInterval: this._processEvery}, options);
  // MongoClient.connect(file, options, (error, client) => {
  //   if (error) {
  //     debug('error connecting to MongoDB using collection: [%s]', collection);
  //     if (cb) {
  //       cb(error, null);
  //     } else {
  //       throw error;
  //     }
  //     return;
  //   }
  //   debug('successful connection to MongoDB using collection: [%s]', collection);
  //   self._db = client;
  //   self._mdb = client.db();
  //   self.db_init(collection, cb);
  // });


  self._db = Datastore;
  self._mdb = new Datastore({
    filename: path.join(filename, collection + '.db'),
    autoload: true,
    onload: err => {
      if (err)
        console.log(err);

    }
  });

  self.db_init(collection, cb);

  return this;
};
