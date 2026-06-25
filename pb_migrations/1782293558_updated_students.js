/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "se1vlwbc",
    "name": "avatar",
    "type": "file",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "mimeTypes": [
        "image/jpeg",
        "image/png",
        "image/webp"
      ],
      "thumbs": null,
      "maxSelect": 1,
      "maxSize": 2097152,
      "protected": false
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove
  collection.schema.removeField("se1vlwbc")

  return dao.saveCollection(collection)
})
