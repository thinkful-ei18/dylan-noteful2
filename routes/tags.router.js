'use strict';
const express = require('express');
const router = express.Router();
const knex = require('../knex');

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

module.exports = router;