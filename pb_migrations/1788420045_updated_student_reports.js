/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("px7z29k647g5697")

  // add field
  collection.fields.addAt(28, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3571151285",
    "max": 10,
    "min": 0,
    "name": "language",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("px7z29k647g5697")

  // remove field
  collection.fields.removeById("text3571151285")

  return app.save(collection)
})
