/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3682517952")

  // add field
  collection.fields.addAt(13, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3997175317",
    "help": "",
    "hidden": false,
    "id": "relcplitem001",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "item",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "txtcplitemnm1",
    "max": 0,
    "min": 0,
    "name": "item_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3682517952")

  // remove field
  collection.fields.removeById("relcplitem001")

  // remove field
  collection.fields.removeById("txtcplitemnm1")

  return app.save(collection)
})
