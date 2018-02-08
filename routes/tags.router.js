'use strict';
const express = require('express');
const router = express.Router();
const knex = require('../knex');
const { UNIQUE_VIOLATION } = require('pg-error-constants');

router.get('/tags', (req, res, next) => {
  const searchTerm = req.query.searchTerm ? req.query.searchTerm : '';
  knex
    .select()
    .from('tags')
    .where(function() {
      if (searchTerm){
        this.where('name', 'like', `%${searchTerm}%`);
      }
    })
    .then(tags => {
      res.json(tags);
      
    })
    .catch(err => next(err));
});

router.get('/tags/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .select()
    .from('tags')
    .where({id})
    .then(tag => {
      if(tag){
        res.json(tag[0]);
      } else{
        next();
      }
    })
    .catch(err => next(err));
});

router.post('/tags', (req, res, next) => {
  const {name} = req.body;
  if (!name) {
    const err = new Error('Name must be present');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex('tags')
    .returning(['id', 'name'])
    .insert(newItem)
    .then(tag => {
      res.location(`${req.originalURrl}/${tag[0].id}`).status(201).json(tag[0]);
    })
    .catch(err => {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'tags_name_key') {
        err = new Error('Tags name is already taken');
        err.status = 409;
      }
      next(err);
    });
});

router.put('/tags/:id', (req, res, next) => {
  const id = req.params.id;

  const {name} = req.body;

  if (!name) {
    const err = new Error('Name must be present');
    err.status = 400;
    return next(err);
  }

  const updateObj = {name};
  
  knex('tags')
    .returning(['id', 'name'])
    .where({id})
    .update(updateObj)
    .then(item => {
      res.status(201).json(item[0]);
    })
    .catch(err =>  {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'tags_name_key') {
        err = new Error('Tag name is already being used');
        err.status = 409;
      }
      next(err);
    });
});

module.exports = router;