/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ez1iq2paxliaj2b")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "9rvolhek",
    "name": "period",
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
    "id": "idxq3kfc",
    "name": "amount",
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
  const collection = dao.findCollectionByNameOrId("ez1iq2paxliaj2b")

  // remove
  collection.schema.removeField("9rvolhek")

  // remove
  collection.schema.removeField("idxq3kfc")

  return dao.saveCollection(collection)
})
