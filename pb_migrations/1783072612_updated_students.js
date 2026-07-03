/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vkyd5rla",
    "name": "balance",
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
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove
  collection.schema.removeField("vkyd5rla")

  return dao.saveCollection(collection)
})
