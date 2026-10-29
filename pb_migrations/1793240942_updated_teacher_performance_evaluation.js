/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1670403901")

  // add field
  collection.fields.addAt(20, new Field({
    "help": "",
    "hidden": false,
    "id": "dateperfrev1",
    "max": "",
    "min": "",
    "name": "review_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "help": "",
    "hidden": false,
    "id": "boolperfdel1",
    "name": "deleted",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1670403901")

  // remove field
  collection.fields.removeById("dateperfrev1")

  // remove field
  collection.fields.removeById("boolperfdel1")

  return app.save(collection)
})
