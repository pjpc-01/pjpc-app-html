/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add field
  collection.fields.addAt(30, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2025135874",
    "max": 0,
    "min": 0,
    "name": "enrichment_classes",
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
  collection.fields.removeById("text2025135874")

  return app.save(collection)
})
