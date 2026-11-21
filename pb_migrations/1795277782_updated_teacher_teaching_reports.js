/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2631945072")

  // update field
  collection.fields.addAt(25, new Field({
    "help": "",
    "hidden": false,
    "id": "m398w4yb",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp"
    ],
    "name": "photos",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [
      "300x300",
      "800x800"
    ],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2631945072")

  // update field
  collection.fields.addAt(25, new Field({
    "help": "",
    "hidden": false,
    "id": "m398w4yb",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp"
    ],
    "name": "photos",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
})
