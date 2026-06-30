/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "luc2wm6f90wwfhb",
    "created": "2026-06-30 08:46:45.942Z",
    "updated": "2026-06-30 08:46:45.942Z",
    "name": "role_permissions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "udf2dxh5",
        "name": "role",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": true,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "obxtbvpm",
        "name": "permissions",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1000000
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
  const collection = dao.findCollectionByNameOrId("luc2wm6f90wwfhb");

  return dao.deleteCollection(collection);
})
