/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // add field
  collection.fields.addAt(30, new Field({
    "help": "",
    "hidden": false,
    "id": "number4286208539",
    "max": null,
    "min": null,
    "name": "epf_employer",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(31, new Field({
    "help": "",
    "hidden": false,
    "id": "number1616090221",
    "max": null,
    "min": null,
    "name": "socso_employer",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(32, new Field({
    "help": "",
    "hidden": false,
    "id": "number3947293433",
    "max": null,
    "min": null,
    "name": "eis_employer",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // remove field
  collection.fields.removeById("number4286208539")

  // remove field
  collection.fields.removeById("number1616090221")

  // remove field
  collection.fields.removeById("number3947293433")

  return app.save(collection)
})
