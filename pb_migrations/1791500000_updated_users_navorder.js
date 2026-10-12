/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")

  // add field: nav_order (json) —— 用户自定义侧边栏菜单顺序（按稳定键 href 存）
  collection.fields.addAt(collection.fields.length, new Field({
    "help": "用户自定义的侧边栏菜单顺序（数组，元素为菜单稳定键；顶层与各分组分开存）",
    "hidden": false,
    "id": "json_navorder01",
    "maxSize": 0,
    "name": "nav_order",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("users")

  // remove field
  collection.fields.removeById("json_navorder01")

  return app.save(collection)
})
