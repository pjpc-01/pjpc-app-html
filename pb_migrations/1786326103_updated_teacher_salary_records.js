/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // add field
  collection.fields.addAt(28, new Field({
    "help": "",
    "hidden": false,
    "id": "json1679950164",
    "maxSize": 0,
    "name": "allowance_items",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(29, new Field({
    "help": "",
    "hidden": false,
    "id": "json883321582",
    "maxSize": 0,
    "name": "bonus_items",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // remove field
  collection.fields.removeById("json1679950164")

  // remove field
  collection.fields.removeById("json883321582")

  return app.save(collection)
})
