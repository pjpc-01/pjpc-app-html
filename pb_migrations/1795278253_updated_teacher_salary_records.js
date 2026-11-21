/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_salary_ym ON teacher_salary_records (year, month)",
      "CREATE INDEX idx_salary_teacher ON teacher_salary_records (teacher_id)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("w6eu671yeje6ul4")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
