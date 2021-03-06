'use strict';
const knex = require('../knex');

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const Treeize = require('treeize');

// TEMP: Simple In-Memory Database
/* 
const data = require('../db/notes');
const simDB = require('../db/simDB');
const notes = simDB.initialize(data);
*/

// Get All (and search by query)
/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
  const searchTerm = req.query.searchTerm ?  req.query.searchTerm : '';
  const folderId = req.query.folderId ? req.query.folderId : '';
  const tagId = req.query.tagId ? req.query.tagId : '';
  /* 
  notes.filter(searchTerm)
    .then(list => {
      res.json(list);
    })
    .catch(err => next(err)); 
  */
  knex
    .select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder name', 'tags.id as tags:id', 'tags.name as tags:name')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where(function() {
      if (searchTerm) {
        this.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .where(function() {
      if (folderId) {
        
        this.where('folder_id', folderId);
      }
    })
    .where(function() {
      if (tagId) {
        const subQuery = knex
          .select('notes.id')
          .from('notes')
          .innerJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
          .where('notes_tags.tag_id', tagId);
        this.whereIn('notes.id', subQuery);
      }
    })
    .orderBy('notes.id', 'asc')
    .then(list => {
      const treeize = new Treeize();
      treeize.grow(list);
      const hydrated = treeize.getData();
      res.json(hydrated);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  /*
  notes.find(noteId)
    .then(item => {
      if (item) {
        res.json(item);
      } else {
        next();
      }
    })
    .catch(err => next(err));
  */

  knex
    .select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder name', 'tags.id as tags:id', 'tags.name as tags:name')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where('notes.id', `${noteId}`)
    .then(item => {
      if (item.length >= 1) {
        const treeize = new Treeize();
        treeize.grow(item);
        const hydrated = treeize.getData();
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { tags } = req.body;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex
    .select()
    .from('notes')
    .where({id: noteId}).then(result => {
      if (result.length === 0) {
        const err = new Error('Invalid Id');
        err.status = 404;
        return next(err);
      }
    });

  knex('notes')
    .where({ id: noteId })
    .returning('id')
    .update(updateObj)
    .then((update) => {
      
      return knex('notes_tags')
        .where('note_id', noteId)
        .del();
    })
    .then(id => {
      if (tags[0] !== null){
        const tagsInsert = tags.map(tagId => ({
          note_id: noteId,
          tag_id: tagId
        }));
        return knex.insert(tagsInsert).into('notes_tags');
      }
      return id;
    })
    .then(() => {
      knex
        .select()
        .from('notes_tags')
        .where('note_id', noteId)
        .then(() => {
        });
      return knex
        .select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder name', 'tags.id as tags:id', 'tags.name as tags:name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(result => {
      const treeize = new Treeize();
      treeize.grow(result);
      const hydrated = treeize.getData();
      res.location(`${req.originalUrl}/${result.id}`).status(200).json(hydrated);
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id, tags } = req.body;
  
  const newItem = { title, content, folder_id };

  let noteId;
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  /*
  notes.create(newItem)
    .then(item => {
      if (item) {
        res.location(`http://${req.headers.host}/notes/${item.id}`).status(201).json(item);
      } 
    })
    .catch(err => next(err));
  */

  knex('notes')
    .returning('id')
    .insert(newItem)
    .then(([id]) => {
      noteId = id;
      if (tags[0] !== null){
        const tagsInsert = tags.map(tagId => ({note_id: noteId, tag_id: tagId}));
        return knex.insert(tagsInsert)
          .into('notes_tags');
      } else {
        return id;
      }
    }).then(() => {
      return knex
        .select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder name', 'tags.id as tags:id', 'tags.name as tags:name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const treeize = new Treeize();
        treeize.grow(result);
        const hydrated = treeize.getData();
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(hydrated);
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;
  
  /*
  notes.delete(id)
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => next(err));
  */
  knex('notes')
    .where({ id: id })
    .del()
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

module.exports = router;