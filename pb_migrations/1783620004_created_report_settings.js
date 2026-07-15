/// <reference path="../pb_data/types.d.ts" />
// Create report_settings collection for customizing student report PDF format.
migrate((db) => {
  const collection = new Collection({
    "id": "pbag4y5v00cl15d",
    "created": "2026-07-14 14:30:00.000Z",
    "updated": "2026-07-14 14:30:00.000Z",
    "name": "report_settings",
    "type": "base",
    "system": false,
    "schema": [
      { "system": false, "id": "rs01", "name": "name", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs02", "name": "schoolName", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs03", "name": "schoolNameEn", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs04", "name": "schoolLogo", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs05", "name": "schoolAddress", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs06", "name": "schoolPhone", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs07", "name": "schoolEmail", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs08", "name": "primaryColor", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs09", "name": "headerTitle", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs10", "name": "headerSubtitle", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs11", "name": "footerText", "type": "text", "required": false, "presentable": false, "unique": false, "options": { "min": null, "max": null } },
      { "system": false, "id": "rs12", "name": "isDefault", "type": "bool", "required": false, "presentable": false, "unique": false, "options": {} },
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  })

  return Dao(db).saveCollection(collection)
}, (db) => {
  return Dao(db).deleteCollection("pbag4y5v00cl15d")
})
