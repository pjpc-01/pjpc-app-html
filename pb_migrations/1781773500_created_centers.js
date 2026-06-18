/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kc397vhuo8w0hoi",
    "created": "2026-06-18 09:05:00.202Z",
    "updated": "2026-06-18 09:05:00.202Z",
    "name": "centers",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "1jchrkfp",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 2,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "3cdrvlgt",
        "name": "code",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": true,
        "options": {
          "min": 2,
          "max": 20,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "ibbnbic8",
        "name": "address",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "qf11opow",
        "name": "phone",
        "type": "text",
        "required": false,
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
        "id": "viopvkgz",
        "name": "manager",
        "type": "text",
        "required": false,
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
        "id": "06nxpx1j",
        "name": "status",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "active",
            "inactive"
          ]
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("kc397vhuo8w0hoi");

  return dao.deleteCollection(collection);
})
