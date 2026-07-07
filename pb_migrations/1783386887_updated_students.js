/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // remove
  collection.schema.removeField("qwcnguhi")

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("yot737rl8uqqnh8")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qwcnguhi",
    "name": "synorex_id",
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
})
