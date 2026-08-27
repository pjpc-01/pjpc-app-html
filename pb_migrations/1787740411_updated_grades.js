/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("mr6yhd5vbvh5whs")

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "vjxq9riu",
    "maxSelect": 1,
    "name": "term",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "midterm",
      "final"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("mr6yhd5vbvh5whs")

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "vjxq9riu",
    "maxSelect": 1,
    "name": "term",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "Term 1",
      "Term 2",
      "Term 3",
      "Final"
    ]
  }))

  return app.save(collection)
})
