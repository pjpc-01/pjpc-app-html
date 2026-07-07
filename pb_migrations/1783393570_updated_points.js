/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("6xd6p7yhw8u8fsz")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "en08imau",
    "name": "total_points",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("6xd6p7yhw8u8fsz")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "en08imau",
    "name": "total_points",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": null,
      "noDecimal": false
    }
  }))

  return dao.saveCollection(collection)
})
