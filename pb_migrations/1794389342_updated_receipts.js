/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("z7v9r11s8ttoc2b")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && @request.auth.role != \"student\"",
    "viewRule": "@request.auth.id != \"\" && @request.auth.role != \"student\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("z7v9r11s8ttoc2b")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
