/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("28nx1zgejhuh9xs")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_schedules_teacher_date ON schedules (teacher_id, date)",
      "CREATE INDEX idx_schedules_date ON schedules (date)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("28nx1zgejhuh9xs")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
