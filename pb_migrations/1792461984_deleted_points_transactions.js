/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ga20fmd0fakzro1");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "yot737rl8uqqnh8",
        "help": "",
        "hidden": false,
        "id": "xsxtd9ca",
        "maxSelect": 2147483647,
        "minSelect": 0,
        "name": "studentId",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "tcm7kz4s",
        "max": null,
        "min": null,
        "name": "points",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "dunsgmab",
        "max": 0,
        "min": 0,
        "name": "reason",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "hofrkpas",
        "maxSelect": 1,
        "name": "category",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "academic",
          "behavior",
          "attendance",
          "other"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "djvae07iufj859g",
        "help": "",
        "hidden": false,
        "id": "azplrs5d",
        "maxSelect": 2147483647,
        "minSelect": 0,
        "name": "operatorId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "plipa4z7",
        "max": 0,
        "min": 0,
        "name": "nfc_card_uid",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "xd2ghmok",
        "max": "",
        "min": "",
        "name": "date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "ga20fmd0fakzro1",
    "indexes": [],
    "listRule": null,
    "name": "points_transactions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
})
