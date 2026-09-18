/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uf6t0w61vas0fnf")

  // add field
  collection.fields.addAt(15, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "vno000ref",
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
  const collection = app.findCollectionByNameOrId("uf6t0w61vas0fnf")

  // remove field
  collection.fields.removeById("vno000ref")

  return app.save(collection)
})
