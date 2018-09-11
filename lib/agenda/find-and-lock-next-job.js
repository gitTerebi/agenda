'use strict';
const debug = require('debug')('agenda:internal:_findAndLockNextJob');
const {createJob} = require('../utils');

/**
 * Find and lock jobs
 * @name Agenda#findAndLockNextJob
 * @function
 * @param {String} jobName name of job to try to lock
 * @param {Object} definition definition used to tell how job is run
 * @param {Function} cb called when job lock fails or passes
 * @access protected
 * @caller jobQueueFilling() only
 * @returns {undefined}
 */
module.exports = function (jobName, definition, cb) {
  const self = this;
  const now = new Date();
  const lockDeadline = new Date(now.valueOf() - definition.lockLifetime);
  debug('_findAndLockNextJob(%s, [Function], cb)', jobName);

  const JOB_PROCESS_WHERE_QUERY = {
    $or: [
      {
        name: jobName,
        lockedAt: null,
        nextRunAt: {$lte: this._nextScanAt},
        disabled: {$ne: true}
      },
      {
        name: jobName,
        lockedAt: {$exists: false},
        nextRunAt: {$lte: this._nextScanAt},
        disabled: {$ne: true}
      },
      // { todo: If ignore if nextRunAt is null (ie it was run but maybe never unlocked)
      //   name: jobName,
      // nextRunAt: {$lte: this._nextScanAt},
      //   lockedAt: {$lte: lockDeadline},
      //   disabled: {$ne: true}
      // }
    ]
  };

  const JOB_PROCESS_SET_QUERY = {$set: {lockedAt: now}};

  //const JOB_RETURN_QUERY = {returnUpdatedDocs: true, sort: this._sort};
  const JOB_RETURN_QUERY = {upsert: false, returnUpdatedDocs: true};

  this._collection.find(JOB_PROCESS_WHERE_QUERY, (err, docs) => {

    //console.log('BEFORE', docs[0]);

    // Find ONE and ONLY ONE job and set the 'lockedAt' time so that job begins to be processed
    this._collection.update(JOB_PROCESS_WHERE_QUERY, JOB_PROCESS_SET_QUERY, JOB_RETURN_QUERY,
      (err, numAffected, result, upsert) => {
        let job;

        //console.log('AFTER', result);

        if (!err && result) {
          debug('found a job available to lock, creating a new job on Agenda with id [%s]', result._id);
          job = createJob(self, result);
        }
        if (err) {
          debug('error occurred when running query to find and lock job');
        }
        cb(err, job);
      });


  });


  //}
};
