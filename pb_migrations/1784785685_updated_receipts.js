/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("z7v9r11s8ttoc2b")

  // add field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "yot737rl8uqqnh8",
    "help": "",
    "hidden": false,
    "id": "relation3072569139",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "student",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("z7v9r11s8ttoc2b")

  // remove field
  collection.fields.removeById("relation3072569139")

  return app.save(collection)
})
