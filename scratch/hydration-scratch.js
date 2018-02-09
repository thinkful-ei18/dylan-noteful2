'use strict';
const list = [
  {
    id: 1,
    name: 'Bob',
    tags: [{name: 'cat', id: 1}, {name: 'cat', id: 2}, {name: 'cat', id: 3}]
  },
  {
    id: 1,
    name: 'Jim',
    tags: [4, 5, 6]
  }
];
function hydrationStation(list){
  const hydrationObj = {};
  const hydration = [];

  list.forEach(item => {
    if (!hydrationObj[item.id]){
      hydrationObj[item.id] = item;
    } else {
      hydrationObj[item.id].tags.push(...item.tags); 
    }
  });

  for(let key in hydrationObj) {
    hydration.push(hydrationObj[key]);
  }
  return hydration;
}
console.log(hydrationStation(list));