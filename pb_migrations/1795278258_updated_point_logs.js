/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("j6umamj8g2o3vka")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_pl_student ON point_logs (student)",
      "CREATE INDEX idx_pl_created ON point_logs (created)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("j6umamj8g2o3vka")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
