/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "rcstngd2fbkdoyh",
    "created": "2026-07-17 10:23:44.665Z",
    "updated": "2026-07-17 10:23:44.665Z",
    "name": "receipt_settings",
    "type": "base",
    "system": false,
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
        "system": false,
        "id": "uqzp3gne",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "p7ykrag5",
        "name": "schoolName",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "msz3iwvl",
        "name": "schoolNameEn",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "laodjtcb",
        "name": "schoolLogo",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "eox5lsjg",
        "name": "schoolAddress",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "turrvonw",
        "name": "schoolPhone",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "quwapnfo",
        "name": "schoolEmail",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "dekxctg4",
        "name": "primaryColor",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "2n8ilygt",
        "name": "secondaryColor",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "4ozhb18x",
        "name": "accentColor",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "mxotdifv",
        "name": "footerText",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "prtlpgof",
        "name": "receiptNote",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "iwtbacue",
        "name": "isDefault",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "autodate_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "autodate_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
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

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("rcstngd2fbkdoyh");
  return app.delete(collection);
})
