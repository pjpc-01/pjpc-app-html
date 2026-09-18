/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "vno000pay",
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
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // remove field
  collection.fields.removeById("vno000pay")

  return app.save(collection)
})
