/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("3wij8h2819awk8n")

  // remove field
  collection.fields.removeById("cpgtlhhf")

  // add field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "number4235404056",
    "max": 999999,
    "min": 0,
    "name": "base_salary",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("3wij8h2819awk8n")

  // add field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "cpgtlhhf",
    "max": 999999,
    "min": 0,
    "name": "base_salary",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // remove field
  collection.fields.removeById("number4235404056")

  return app.save(collection)
})
