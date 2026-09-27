/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("report_settings")

  // add field: activities（报告默认的活动参与文案）
  collection.fields.addAt(23, new Field({
    "help": "新建报告时预填的活动参与条目",
    "hidden": false,
    "id": "json_act_set01",
    "maxSize": 5000,
    "name": "activities",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("report_settings")
  collection.fields.removeById("json_act_set01")
  return app.save(collection)
})
