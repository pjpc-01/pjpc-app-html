/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "1gp0u4y6szwxlxk",
    "created": "2026-07-08 05:20:17.095Z",
    "updated": "2026-07-08 05:20:17.095Z",
    "name": "attendance_settings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "mmwjerhq",
        "name": "center",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "u6l2gusp",
        "name": "config",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 100000
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
  const collection = dao.findCollectionByNameOrId("1gp0u4y6szwxlxk");

  return dao.deleteCollection(collection);
})
