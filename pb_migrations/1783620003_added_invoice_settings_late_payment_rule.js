/// <reference path="../pb_data/types.d.ts" />
// Add latePaymentRule text field to invoice_settings for customizable late payment terms display.
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("iilekdq2fbkdoyg")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "new09",
    "name": "latePaymentRule",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": null, "max": null }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("iilekdq2fbkdoyg")

  collection.schema.removeField("latePaymentRule")

  return dao.saveCollection(collection)
})
