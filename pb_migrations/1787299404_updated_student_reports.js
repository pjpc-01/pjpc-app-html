/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("px7z29k647g5697")

  // add field
  collection.fields.addAt(27, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2731435517",
    "max": 0,
    "min": 0,
    "name": "homework_comment",
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
  collection.fields.removeById("text2731435517")

  return app.save(collection)
})
