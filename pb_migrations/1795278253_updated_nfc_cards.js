/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("c21d91di524jrjz")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_cards_uid ON nfc_cards (card_uid)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("c21d91di524jrjz")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
