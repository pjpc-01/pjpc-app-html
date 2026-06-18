/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "rdcl9xj8",
    "name": "email",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "xqqqxlvn",
    "name": "cardNumber",
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
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove
  collection.schema.removeField("rdcl9xj8")

  // remove
  collection.schema.removeField("xqqqxlvn")

  return dao.saveCollection(collection)
})
