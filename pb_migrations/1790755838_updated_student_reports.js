/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("px7z29k647g5697")

  // add field
  collection.fields.addAt(31, new Field({
    "help": "",
    "hidden": false,
    "id": "json3168466638",
    "maxSize": 0,
    "name": "enrichment",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("px7z29k647g5697")

  // remove field
  collection.fields.removeById("json3168466638")

  return app.save(collection)
})
