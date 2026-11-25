/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add field
  collection.fields.addAt(31, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3932047689",
    "max": 0,
    "min": 0,
    "name": "class_name",
    "pattern": "",
    "presentable": true,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove field
  collection.fields.removeById("text3932047689")

  return app.save(collection)
})
