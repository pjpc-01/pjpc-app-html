/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uf6t0w61vas0fnf")

  // add field
  collection.fields.addAt(12, new Field({
    "cascadeDelete": false,
    "collectionId": "ez1iq2paxliaj2b",
    "help": "",
    "hidden": false,
    "id": "relation2422544196",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "invoice",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(13, new Field({
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
  const collection = app.findCollectionByNameOrId("uf6t0w61vas0fnf")

  // remove field
  collection.fields.removeById("relation2422544196")

  // remove field
  collection.fields.removeById("relation3072569139")

  return app.save(collection)
})
