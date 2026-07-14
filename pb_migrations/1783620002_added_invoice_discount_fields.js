/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("invoices")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "inv_discount_field",
    "name": "discount",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": 0, "max": null, "noDecimal": false }
  }))

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "inv_discount_type_field",
    "name": "discountType",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "maxSelect": 1, "values": ["amount", "percent"] }
  }))

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "inv_late_payment_rule_field",
    "name": "latePaymentRule",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": { "min": null, "max": null, "pattern": "" }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("invoices")
  collection.schema.removeField("discount")
  collection.schema.removeField("discountType")
  collection.schema.removeField("latePaymentRule")
  return dao.saveCollection(collection)
})
