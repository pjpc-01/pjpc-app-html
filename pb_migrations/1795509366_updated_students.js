/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add field
  collection.fields.addAt(32, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text337075331",
    "max": 0,
    "min": 0,
    "name": "healthInfo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove field
  collection.fields.removeById("text337075331")

  return app.save(collection)
})
