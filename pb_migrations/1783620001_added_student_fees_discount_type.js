/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("student_fees")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "discount_type_field",
    "name": "discount_type",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": ["amount", "percent"]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("student_fees")
  collection.schema.removeField("discount_type")
  return dao.saveCollection(collection)
})
