/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_students_center ON students (center)",
      "CREATE INDEX idx_students_status ON students (status)",
      "CREATE INDEX idx_students_sid ON students (student_id)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("yot737rl8uqqnh8")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
