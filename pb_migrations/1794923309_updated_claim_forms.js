/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830723013")

  // add field
  collection.fields.addAt(17, new Field({
    "help": "",
    "hidden": false,
    "id": "file501998498",
    "maxSelect": 10,
    "maxSize": 52428800,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/gif",
      "application/pdf"
    ],
    "name": "receipts",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830723013")

  // remove field
  collection.fields.removeById("file501998498")

  return app.save(collection)
})
