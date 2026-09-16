/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("jneqz6ind8krxc3")

  // add field
  collection.fields.addAt(12, new Field({
    "cascadeDelete": false,
    "collectionId": "yot737rl8uqqnh8",
    "help": "",
    "hidden": false,
    "id": "relation3869745726",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "student_ids",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("jneqz6ind8krxc3")

  // remove field
  collection.fields.removeById("relation3869745726")

  return app.save(collection)
})
