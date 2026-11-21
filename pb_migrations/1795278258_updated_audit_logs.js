/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wcx54swfji0kias")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_audit_created ON audit_logs (created)",
      "CREATE INDEX idx_audit_user ON audit_logs (user_id)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("wcx54swfji0kias")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_audit_created ON audit_logs (created)"
    ]
  }, collection)

  return app.save(collection)
})
