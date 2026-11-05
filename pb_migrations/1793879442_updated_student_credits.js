/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3261958420")

  // add field
  collection.fields.addAt(14, new Field({
    "help": "",
    "hidden": false,
    "id": "number2850781065",
    "max": null,
    "min": null,
    "name": "remaining",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "help": "",
    "hidden": false,
    "id": "number3858352964",
    "max": null,
    "min": null,
    "name": "usedAmount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "help": "",
    "hidden": false,
    "id": "json4033023375",
    "maxSize": 0,
    "name": "usageLog",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3261958420")

  // remove field
  collection.fields.removeById("number2850781065")

  // remove field
  collection.fields.removeById("number3858352964")

  // remove field
  collection.fields.removeById("json4033023375")

  return app.save(collection)
})
