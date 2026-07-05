/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("c21d91di524jrjz")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "gqk1maq5",
    "name": "nfc_uid",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("c21d91di524jrjz")

  // remove
  collection.schema.removeField("gqk1maq5")

  return dao.saveCollection(collection)
})
