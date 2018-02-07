'use strict';
const knex = require('../knex');

// knex.select(1).then(res => console.log(res));

// const searchTerm = '';
// knex
//   .select()
//   .from('notes')
//   .where('title', 'like', `%${searchTerm}%`)
//   .then(res => console.log(res));

// knex
//   .select()
//   .from('notes')
//   .where({id: '1000'})
//   .then(res => console.log(res));

// knex('notes')
//   .where({id: 1000})
//   .returning(['id', 'title', 'content'])
//   .update({
//     title: 'cats'
//   })
//   .then(res => console.log(res));

// knex('notes')
//   .returning(['id', 'title', 'content', 'created'])
//   .insert({
//     title: 'A lot of cats',
//     content: 'CATS'
//   })
//   .then(res => console.log(res));

// knex('notes')
//   .where({id: 1012})
//   .del()
//   .then(res => console.log(res));

knex
  .select()
  .from('folders')
  .where({id: 100})
  .then(res => {
    console.log(res[0]);
  });