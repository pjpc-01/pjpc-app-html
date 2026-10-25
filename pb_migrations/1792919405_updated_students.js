/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add field
  collection.fields.addAt(29, new Field({
    "help": "",
    "hidden": false,
    "id": "number45100930",
    "max": null,
    "min": null,
    "name": "contribution_points",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove field
  collection.fields.removeById("number45100930")

  return app.save(collection)
})
