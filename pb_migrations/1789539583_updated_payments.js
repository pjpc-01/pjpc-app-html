/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // add field
  collection.fields.addAt(10, new Field({
    "help": "",
    "hidden": false,
    "id": "bool3946532403",
    "name": "deleted",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // remove field
  collection.fields.removeById("bool3946532403")

  return app.save(collection)
})
