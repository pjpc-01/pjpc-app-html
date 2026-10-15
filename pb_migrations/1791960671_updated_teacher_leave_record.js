/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("j6lv4dk26e5hn2j")

  // add field
  collection.fields.addAt(16, new Field({
    "help": "",
    "hidden": false,
    "id": "select3317178062",
    "maxSelect": 1,
    "name": "period",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "full_day",
      "morning",
      "afternoon"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("j6lv4dk26e5hn2j")

  // remove field
  collection.fields.removeById("select3317178062")

  return app.save(collection)
})
