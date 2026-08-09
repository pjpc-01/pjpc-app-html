/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("3wij8h2819awk8n")

  // add field
  collection.fields.addAt(20, new Field({
    "help": "",
    "hidden": false,
    "id": "number2677571450",
    "max": null,
    "min": null,
    "name": "bonus",
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
  collection.fields.removeById("number2677571450")

  return app.save(collection)
})
