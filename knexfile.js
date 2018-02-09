'use strict';

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://localhost/noteful-app',
    debug: true, // http://knexjs.org/#Installation-debug
    pool: { min: 1, max: 2 }
  },
  test: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://localhost/noteful_test',
    debug: true,
    pool: {min: 1, max: 2}
  },
  production: {
    client: 'pg',
    connection: 'postgres://mkrlncgqmdzvxz:033d6c172db8271075fa757c9e144408ac15cea944419880955837167e7e13ec@ec2-54-243-59-122.compute-1.amazonaws.com:5432/d3qrhfkikrn8pn'
  }
};
