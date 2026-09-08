/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("3wij8h2819awk8n")

  // add field
  collection.fields.addAt(28, new Field({
    "help": "",
    "hidden": false,
    "id": "number4211807875",
    "max": 1,
    "min": 0,
    "name": "epf_employer_rate",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(29, new Field({
    "help": "",
    "hidden": false,
    "id": "number3662573923",
    "max": 1,
    "min": 0,
    "name": "socso_employer_rate",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(30, new Field({
    "help": "",
    "hidden": false,
    "id": "number3081897735",
    "max": 1,
    "min": 0,
    "name": "eis_employer_rate",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("3wij8h2819awk8n")

  // remove field
  collection.fields.removeById("number4211807875")

  // remove field
  collection.fields.removeById("number3662573923")

  // remove field
  collection.fields.removeById("number3081897735")

  return app.save(collection)
})
