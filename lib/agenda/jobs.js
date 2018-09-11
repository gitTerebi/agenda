'use strict';
const {createJob} = require('../utils');

/**
 * Finds all jobs matching 'query'
 * @name Agenda#jobs
 * @function
 * @param {Object} query object for MongoDB
 * @returns {Promise} resolves when fails or passes
 */
module.exports = async function (query) {

  const result = await
    new Promise((resolve, error) => {
      this._collection.find(query, (err, docs) => {
        return resolve(docs);
      })
    });

      //.toArray();

  return result.map(job => createJob(this, job));
};
