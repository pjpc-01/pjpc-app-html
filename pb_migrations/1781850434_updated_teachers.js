/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("djvae07iufj859g")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "yahm5sae",
    "name": "centerId",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "kc397vhuo8w0hoi",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": [
        "name",
        "code"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("djvae07iufj859g")

  // remove
  collection.schema.removeField("yahm5sae")

  return dao.saveCollection(collection)
})
