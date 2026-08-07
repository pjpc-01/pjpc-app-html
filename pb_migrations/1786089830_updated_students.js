/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add field
  collection.fields.addAt(25, new Field({
    "help": "",
    "hidden": false,
    "id": "bool3150096338",
    "name": "is_peralihan",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove field
  collection.fields.removeById("bool3150096338")

  return app.save(collection)
})
