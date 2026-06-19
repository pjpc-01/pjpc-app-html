/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("0chx95llhzy99xb")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "yka62h1r",
    "name": "centerId",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "kc397vhuo8w0hoi",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": [
        "name",
        "code"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("0chx95llhzy99xb")

  // remove
  collection.schema.removeField("yka62h1r")

  return dao.saveCollection(collection)
})
