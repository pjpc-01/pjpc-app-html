/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("djvae07iufj859g")

  // add field
  collection.fields.addAt(28, new Field({
    "help": "",
    "hidden": false,
    "id": "bool3658893681",
    "name": "crossCenter",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("djvae07iufj859g")

  // remove field
  collection.fields.removeById("bool3658893681")

  return app.save(collection)
})
