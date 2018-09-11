/* globals describe, it, beforeEach, afterEach */
'use strict';
const delay = require('delay');
const Datastore = require('nedb');
const Agenda = require('..');

const agendaDatabase = 'agenda-test';
const mongoCfg = 'C:\\nedb';

// Create agenda instances
let agenda = null;
let mongoDb = null;
let mongoClient = null;

const clearJobs = () => {
  return mongoDb.remove({}, {multi: true});
};

const jobType = 'do work';
const jobProcessor = () => {
};

describe('Retry', () => {
  beforeEach(() => {
    return new Promise(async resolve => {
      agenda = new Agenda({
        db: {
          filename: mongoCfg,
          collection: agendaDatabase
        }
      }, async () => {
        mongoDb = agenda._mdb;
        await delay(50);
        await clearJobs();
        agenda.define('someJob', jobProcessor);
        agenda.define('send email', jobProcessor);
        agenda.define('some job', jobProcessor);
        agenda.define(jobType, jobProcessor);
        return resolve();
      });
    });

    // agenda = new Agenda({
    //   db: {
    //     address: mongoCfg
    //   }
    // }, err => {
    //   if (err) {
    //     done(err);
    //   }
    //   MongoClient.connect(mongoCfg, async(error, client) => {
    //     mongoClient = client;
    //     mongoDb = client.db(agendaDatabase);
    //
    //     await delay(50);
    //     await clearJobs();
    //
    //     agenda.define('someJob', jobProcessor);
    //     agenda.define('send email', jobProcessor);
    //     agenda.define('some job', jobProcessor);
    //     agenda.define(jobType, jobProcessor);
    //
    //     done();
    //   });
    // });
  });

  afterEach(() => {
    return new Promise(async resolve => {
      await delay(50);
      await agenda.stop();
      await clearJobs();
      return resolve();
    });
  });

  it('should retry a job', async () => {
    let shouldFail = true;

    agenda.processEvery(100); // Shave 5s off test runtime :grin:
    agenda.define('a job', (job, done) => {
      if (shouldFail) {
        shouldFail = false;
        return done(new Error('test failure'));
      }
      done();
    });

    agenda.on('fail:a job', (err, job) => {
      if (err) {
        // Do nothing as this is expected to fail.
      }
      job.schedule('now').save();
    });

    const successPromise = new Promise(resolve =>
      agenda.on('success:a job', resolve)
    );

    await agenda.now('a job');

    await agenda.start();
    await successPromise;
  });
});
