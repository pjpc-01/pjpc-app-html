/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("px7z29k647g5697")

  collection.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'teacher'"
  collection.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'teacher' || @request.auth.role = 'parent'"
  collection.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'teacher'"
  collection.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'teacher'"
  collection.deleteRule = "@request.auth.role = 'admin'"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("px7z29k647g5697")

  collection.listRule = null
  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  return dao.saveCollection(collection)
})
