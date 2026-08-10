/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // add field
  collection.fields.addAt(26, new Field({
    "help": "",
    "hidden": false,
    "id": "number1239810022",
    "max": null,
    "min": null,
    "name": "allowance_travel",
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
    "id": "json2188158495",
    "maxSize": 0,
    "name": "custom_bonuses",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // remove field
  collection.fields.removeById("number1239810022")

  // remove field
  collection.fields.removeById("json2188158495")

  return app.save(collection)
})
