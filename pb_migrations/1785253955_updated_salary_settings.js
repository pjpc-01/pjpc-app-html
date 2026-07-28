/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("slrystngd2fbkdoyi")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "laodjtcc",
    "max": 10000000,
    "min": 0,
    "name": "schoolLogo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("slrystngd2fbkdoyi")

  // update field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "laodjtcc",
    "max": 0,
    "min": 0,
    "name": "schoolLogo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
