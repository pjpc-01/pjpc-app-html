/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "mr6yhd5vbvh5whs",
    "created": "2026-06-23 05:49:26.850Z",
    "updated": "2026-06-23 05:49:26.850Z",
    "name": "grades",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "rr2s5ymx",
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
        "id": "0xzaaefw",
        "name": "subject",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "华文",
            "国文",
            "英文",
            "数学",
            "科学",
            "历史",
            "地理",
            "道德",
            "美术",
            "音乐",
            "体育",
            "其他"
          ]
        }
      },
      {
        "system": false,
        "id": "vjxq9riu",
        "name": "term",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Term 1",
            "Term 2",
            "Term 3",
            "Final"
          ]
        }
      },
      {
        "system": false,
        "id": "wizitk3z",
        "name": "year",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "jwvtqpsk",
        "name": "score",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "ramqnqie",
        "name": "grade_letter",
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
        "id": "qj4rpfxo",
        "name": "teacher_comment",
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
        "id": "y1sbi8po",
        "name": "teacherId",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "djvae07iufj859g",
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
  const collection = dao.findCollectionByNameOrId("mr6yhd5vbvh5whs");

  return dao.deleteCollection(collection);
})
