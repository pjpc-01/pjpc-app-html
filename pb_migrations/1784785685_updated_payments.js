/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // add field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "ez1iq2paxliaj2b",
    "help": "",
    "hidden": false,
    "id": "relation2422544196",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "invoice",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // remove field
  collection.fields.removeById("relation2422544196")

  return app.save(collection)
})
