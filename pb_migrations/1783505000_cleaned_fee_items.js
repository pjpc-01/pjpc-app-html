/// <reference path="../pb_data/types.d.ts" />
// Remove discount/latePaymentFee/sixMonthPay from fee_items (global price list).
// These belong in student_fees (per-student assignment), not the menu.
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h2n4glagecz5xps")

  // removeField accepts field id, not name
  collection.schema.removeField("624c7309")  // discount
  collection.schema.removeField("48b93d20")  // latePaymentFee
  collection.schema.removeField("8aee8772")  // sixMonthPay

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h2n4glagecz5xps")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "624c7309",
    "name": "discount",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": null, "max": null }
  }))

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "48b93d20",
    "name": "latePaymentFee",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": null, "max": null }
  }))

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "8aee8772",
    "name": "sixMonthPay",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
})
