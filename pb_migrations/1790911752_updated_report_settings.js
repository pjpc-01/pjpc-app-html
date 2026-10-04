/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbag4y5v00cl15d")

  // add field
  collection.fields.addAt(24, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1128526267",
    "max": 10000000,
    "min": 0,
    "name": "schoolLogo2",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbag4y5v00cl15d")

  // remove field
  collection.fields.removeById("text1128526267")

  return app.save(collection)
})
