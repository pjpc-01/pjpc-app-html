/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "v2kbzrz51d65n8a",
    "created": "2026-06-23 05:49:26.831Z",
    "updated": "2026-06-23 05:49:26.831Z",
    "name": "daily_logs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "mdrcpipv",
        "name": "studentId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "yot737rl8uqqnh8",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "hl2l5a5x",
        "name": "teacherId",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "djvae07iufj859g",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "zqbvcbmo",
        "name": "date",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "8xbvknme",
        "name": "homework_done",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "zae0yrkg",
        "name": "nap",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "eoqk58gz",
        "name": "meal",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "ate_all",
            "ate_some",
            "refused"
          ]
        }
      },
      {
        "system": false,
        "id": "5dv4umgq",
        "name": "mood",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "happy",
            "neutral",
            "upset"
          ]
        }
      },
      {
        "system": false,
        "id": "of6nrccx",
        "name": "behavior_note",
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
        "id": "2gdqbvuf",
        "name": "photo",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/webp"
          ],
          "thumbs": null,
          "maxSelect": 3,
          "maxSize": 5242880,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "bkknaato",
        "name": "parent_viewed",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "gzbsvw2y",
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
          "displayFields": null
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
  const collection = dao.findCollectionByNameOrId("v2kbzrz51d65n8a");

  return dao.deleteCollection(collection);
})
