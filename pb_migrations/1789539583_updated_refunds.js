/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uf6t0w61vas0fnf")

  // add field
  collection.fields.addAt(14, new Field({
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
  const collection = app.findCollectionByNameOrId("uf6t0w61vas0fnf")

  // remove field
  collection.fields.removeById("bool3946532403")

  return app.save(collection)
})
