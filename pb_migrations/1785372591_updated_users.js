/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(15, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3415494426",
    "max": 0,
    "min": 0,
    "name": "student_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text3415494426")

  return app.save(collection)
})
