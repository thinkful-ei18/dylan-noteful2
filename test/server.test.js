'use strict';

/**
 * DISCLAIMER:
 * The examples shown below are superficial tests which only check the API responses.
 * They do not verify the responses against the data in the database. We will learn
 * how to crosscheck the API responses against the database in a later exercise.
 */
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const expect = chai.expect;
const knex = require('../knex');
const seedData = require('../db/seed');

chai.use(chaiHttp);
chai.use(chaiSpies);

describe('Reality check', function() {
  it('true should be true', function() {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4', function() {
    expect(2 + 2).to.equal(4);
  });
});

describe('Environment', () => {
  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

  it('connection should be test database', () => {
    expect(knex.client.connectionSettings.database).to.equal('noteful-test');
  });
});

describe('Express static', function() {
  it('GET request "/" should return the index page', function() {
    return chai
      .request(app)
      .get('/')
      .then(function(res) {
        expect(res).to.exist;
        expect(res).to.have.status(200);
        expect(res).to.be.html;
      });
  });
});

describe('404 handler', function() {
  it('should respond with 404 when given a bad path', function() {
    const spy = chai.spy();
    return chai
      .request(app)
      .get('/bad/path')
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });
});

describe('GET /v2/notes', function() {
  it('should return the default of 10 Notes ', function() {
    let count;
    return knex
      .count()
      .from('notes')
      .then(([result]) => {
        count = Number(result.count);
        return chai.request(app).get('/v2/notes');
      })
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(count);
      });
  });

  it('should return a list with the correct right fields', function() {
    return chai
      .request(app)
      .get('/v2/notes')
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        res.body.forEach(function(item) {
          expect(item).to.be.a('object');
          expect(item).to.include.keys('id', 'title', 'content');
        });
      });
  });

  it('should return correct search results for a searchTerm query', function() {
    let res;
    return chai
      .request(app)
      .get('/v2/notes?searchTerm=gaga')
      .then(function(_res) {
        res = _res;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(1);
        expect(res.body[0]).to.be.an('object');
        return knex
          .select()
          .from('notes')
          .where('title', 'like', '%gaga%');
      })
      .then(data => {
        expect(res.body[0].id).to.equal(data[0].id);
      });
  });

  it('should search by folder id', function() {
    const dataPromise = knex
      .select()
      .from('notes')
      .where('folder_id', 103)
      .orderBy('notes.id');

    const apiPromise = chai.request(app).get('/v2/notes?folderId=103');

    return Promise.all([
      dataPromise,
      apiPromise
    ]).then(function([data, res]) {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.a('array');
      expect(res.body).to.have.length(2);
      expect(res.body[0]).to.be.an('object');
    });
  });

  it('should search by tag id', function() {
    const dataPromise = knex
      .select()
      .from('notes')
      .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
      .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
      .where('tags.id', 1);
    
    const apiPromise = chai.request(app).get('/v2/notes?tagId=1');

    return Promise.all([dataPromise, apiPromise]).then(function([data, res]){
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.length(4);
      expect(data).to.have.length(4);
      expect(res.body[0].id).to.equal(data[0].note_id);
    });
  });

  it('should return an empty array for an incorrect query', function() {
    let res;
    return chai
      .request(app)
      .get('/v2/notes?searchTerm=Not%20a%20Valid%20Search')
      .then(function(_res) {
        res = _res;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(0);
        return knex
          .select()
          .from('notes')
          .where('title', 'like', '%Not a Valid Search%');
      })
      .then(result => {
        expect(res.body).to.deep.equal(result);
      });
  });
});

describe('GET /v2/notes/:id', function() {
  it('should return correct notes', function() {
    let res;
    return chai
      .request(app)
      .get('/v2/notes/1000')
      .then(function(_res) {
        res = _res;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body[0]).to.be.an('object');
        expect(res.body[0]).to.include.keys('id', 'title', 'content');
        expect(res.body[0].id).to.equal(1000);
        expect(res.body[0].title).to.equal('5 life lessons learned from cats');
        return knex
          .select()
          .from('notes')
          .where('id', 1000);
      })
      .then(result => {
        expect(res.body[0].id).to.equal(result[0].id);
      });
  });

  it('should respond with a 404 for an invalid id', function() {
    const spy = chai.spy();
    return chai
      .request(app)
      .get('/v2/notes/9999')
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });
});

describe('POST /v2/notes', function() {
  it('should create and return a new item when provided valid data', function () {
    const newItem = {
      'title': 'The best article about cats ever!',
      'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
      'tags': []
    };
    let body;
    return chai.request(app)
      .post('/v2/notes')
      .send(newItem)
      .then(function (res) {
        body = res.body[0];
        expect(res).to.have.status(201);
        expect(res).to.have.header('location');
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('id', 'title', 'content');
        return knex.select().from('notes').where('id', body.id);
      })
      .then(([data]) => {
        expect(body.title).to.equal(data.title);
        expect(body.content).to.equal(data.content);
      });
  });

  it.only('should return an error when missing "title" field', function() {
    const newItem = { foo: 'bar' };
    const spy = chai.spy();
    return chai
      .request(app)
      .post('/v2/notes')
      .send(newItem)
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        const res = err.response;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body.message).to.equal('Missing `title` in request body');
        return knex.select().from('notes');
      })
      .then(result => {
        expect(result).to.have.length(10);
      });
  });
});

describe('PUT /v2/notes/:id', function() {
  it('should update the note', function() {
    const updateItem = {
      title: 'What about dogs?!',
      content: 'woof woof',
      tags: []
    };
    let body;
    return chai
      .request(app)
      .put('/v2/notes/1001')
      .send(updateItem)
      .then(function(res) {
        body = res.body[0];
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('id', 'title', 'content');

        expect(body.id).to.equal(1001);
        expect(body.title).to.equal(updateItem.title);
        expect(body.content).to.equal(updateItem.content);
        return knex
          .select()
          .from('notes')
          .where('id', body.id);
      })
      .then(([result]) => {
        expect(result.id).to.equal(body.id);
        expect(result.content).to.equal(body.content);
      });
  });

  it('should respond with a 404 for an invalid id', function() {
    const updateItem = {
      title: 'What about dogs?!',
      content: 'woof woof',
      tags: []
    };
    const spy = chai.spy();
    return chai
      .request(app)
      .put('/v2/notes/9999')
      .send(updateItem)
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });

  it('should return an error when missing "title" field', function() {
    const updateItem = {
      foo: 'bar'
    };
    const spy = chai.spy();
    return chai
      .request(app)
      .put('/v2/notes/1001')
      .send(updateItem)
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        const res = err.response;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body.message).to.equal('Missing `title` in request body');
        return knex
          .select()
          .from('notes')
          .where('id', 1001);
      })
      .then(([result]) => {
        expect(result.title).to.equal('What the government doesn\'t want you to know about cats');
      });
  });
});

describe('DELETE  /v2/notes/:id', function() {
  it('should delete an item by id', function() {
    return chai
      .request(app)
      .delete('/v2/notes/1006')
      .then(function(res) {
        expect(res).to.have.status(204);
        return knex
          .select()
          .from('notes');
      })
      .then(result => {
        expect(result).to.have.length(9);
      });
  });

  it('should respond with a 404 for an invalid id', function() {
    const spy = chai.spy();
    return chai
      .request(app)
      .delete('/v2/notes/9999')
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });
});

before(function() {
  // noop
});

beforeEach(function() {
  return seedData();
});

afterEach(function() {
  // noop
});

after(function() {
  // destroy the connection
  return knex.destroy();
});
