/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("28nx1zgejhuh9xs")

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "ogfuim3a",
    "max": 0,
    "min": 0,
    "name": "teacher_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("28nx1zgejhuh9xs")

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "ogfuim3a",
    "max": 0,
    "min": 0,
    "name": "teacher_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
