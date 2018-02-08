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
      
    });
});

module.exports = router;