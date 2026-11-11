/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("iilekdq2fbkdoyg")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && @request.auth.role != \"student\"",
    "viewRule": "@request.auth.id != \"\" && @request.auth.role != \"student\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("iilekdq2fbkdoyg")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
