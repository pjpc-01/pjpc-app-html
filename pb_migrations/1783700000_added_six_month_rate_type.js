/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("student_fees")
  
  collection.fields.push(
    new SelectField({
      "system": false,
      "id": "six_month_rate_type_field",
      "name": "six_month_pay_rate_type",
      "required": false,
      "presentable": false,
      "hidden": false,
      "maxSelect": 1,
      "values": ["amount", "percent"]
    })
  )

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("student_fees")
  const field = collection.fields.find((f) => f.name === "six_month_pay_rate_type")
  if (field) {
    collection.fields = collection.fields.filter((f) => f.name !== "six_month_pay_rate_type")
  }
  return app.save(collection)
})
