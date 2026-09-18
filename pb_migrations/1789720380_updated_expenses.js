/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("lcrhjo4xaluxd0q")

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "vno000exp",
    "max": 200,
    "min": 0,
    "name": "voucher_no",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("lcrhjo4xaluxd0q")

  // remove field
  collection.fields.removeById("vno000exp")

  return app.save(collection)
})
