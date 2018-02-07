'use strict';
const express = require('express');
const knex = require('../knex');
const router = express.Router();

router.get('/folders', (req, res, next) => {
  knex
    .select()
    .from('folders')
    .then(list => {
      res.json(list);
    })
    .catch(err => next(err));
});

router.get('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;

  knex
    .select()
    .from('folders')
    .where({ id: folderId })
    .then(item => {
      if (item) {
        res.json(item[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.post('/folders', (req, res, next) => {
  const { name } = req.body;
  const newFolder = { name };

  if (!newFolder.name) {
    const err = new Error('Folder must have a title');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .returning(['id', 'name'])
    .insert(newFolder)
    .then(folder => {
      if (folder){
        res.json(folder[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.put('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  const { name } = req.body;
  const updateFolder = { name };

  if (!updateFolder.name) {
    const err = new Error('Folder must have a name');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .where({id: folderId})
    .returning(['id', 'name'])
    .update(updateFolder)
    .then(folder => {
      if (folder) {
        res.json(folder[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.delete('/folders/:id', )

module.exports = router;
