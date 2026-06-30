/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("luc2wm6f90wwfhb")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "epu2ptmg",
    "name": "label",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": 50,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("luc2wm6f90wwfhb")

  // remove
  collection.schema.removeField("epu2ptmg")

  return dao.saveCollection(collection)
})
