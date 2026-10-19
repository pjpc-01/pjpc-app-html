/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("px7z29k647g5697")

  // update field
  collection.fields.addAt(29, new Field({
    "help": "",
    "hidden": false,
    "id": "file562378054",
    "maxSelect": 6,
    "maxSize": 20971520,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf"
    ],
    "name": "report_photos",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("px7z29k647g5697")

  // update field
  collection.fields.addAt(29, new Field({
    "help": "",
    "hidden": false,
    "id": "file562378054",
    "maxSelect": 6,
    "maxSize": 5242880,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ],
    "name": "report_photos",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
})
