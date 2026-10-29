/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1670403901")

  // update field
  collection.fields.addAt(17, new Field({
    "help": "",
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "draft",
      "submitted",
      "reviewed",
      "approved",
      "finalized"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1670403901")

  // update field
  collection.fields.addAt(17, new Field({
    "help": "",
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "draft",
      "submitted",
      "reviewed",
      "approved"
    ]
  }))

  return app.save(collection)
})
