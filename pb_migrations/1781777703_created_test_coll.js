/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "cw7ef3gy50ci5lj",
    "created": "2026-06-18 10:15:03.151Z",
    "updated": "2026-06-18 10:15:03.151Z",
    "name": "test_coll",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "yoqrvy1b",
        "name": "test_field",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("cw7ef3gy50ci5lj");

  return dao.deleteCollection(collection);
})
