/// <reference path="../pb_data/types.d.ts" />
// Add global late payment rules to invoice_settings.
// Applied by auto-generate billing engine when invoice is overdue.
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("iilekdq2fbkdoyg")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "new07",
    "name": "late_payment_fee",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": 0, "max": null }
  }))

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "new08",
    "name": "late_payment_grace_days",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": 0, "max": null }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("iilekdq2fbkdoyg")

  collection.schema.removeField("late_payment_fee")
  collection.schema.removeField("late_payment_grace_days")

  return dao.saveCollection(collection)
})
