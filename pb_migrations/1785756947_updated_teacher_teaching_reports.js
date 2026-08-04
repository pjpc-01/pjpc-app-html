/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2631945072")

  // remove field
  collection.fields.removeById("80htee7x")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "7ohos26o",
    "max": 0,
    "min": 0,
    "name": "teacher_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2631945072")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "djvae07iufj859g",
    "help": "",
    "hidden": false,
    "id": "80htee7x",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "teacher_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("7ohos26o")

  return app.save(collection)
})
