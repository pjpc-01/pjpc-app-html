/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("3wij8h2819awk8n")

  // add field
  collection.fields.addAt(25, new Field({
    "help": "",
    "hidden": false,
    "id": "bool2624811230",
    "name": "pcb_enabled",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "help": "",
    "hidden": false,
    "id": "number1929055983",
    "max": null,
    "min": null,
    "name": "pcb_rate",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "help": "",
    "hidden": false,
    "id": "number136167414",
    "max": null,
    "min": null,
    "name": "pcb_amount",
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
  collection.fields.removeById("bool2624811230")

  // remove field
  collection.fields.removeById("number1929055983")

  // remove field
  collection.fields.removeById("number136167414")

  return app.save(collection)
})
