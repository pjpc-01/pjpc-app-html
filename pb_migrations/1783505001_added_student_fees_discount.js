/// <reference path="../pb_data/types.d.ts" />
// Add per-student discount and 6-month prepay fields to student_fees.
// These adjust the total when auto-generating monthly invoices.
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4r9rf2vugqehbg6")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "new04",
    "name": "discount",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": null, "max": null }
  }))

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "new05",
    "name": "six_month_pay",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "new06",
    "name": "six_month_pay_rate",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": 0, "max": 1 }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4r9rf2vugqehbg6")

  collection.schema.removeField("discount")
  collection.schema.removeField("six_month_pay")
  collection.schema.removeField("six_month_pay_rate")

  return dao.saveCollection(collection)
})
