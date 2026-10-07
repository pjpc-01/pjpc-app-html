/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const t = new Collection({
    "id": "pbc_examtgt0001",
    "name": "exam_targets",
    "type": "base",
    "system": false,
    "listRule": null, "viewRule": null, "createRule": null, "updateRule": null, "deleteRule": null,
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "help": "", "hidden": false, "id": "text3208210256", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "autogeneratePattern": "", "help": "学生记录 id（students.id）", "hidden": false, "id": "et_sid", "max": 0, "min": 0, "name": "student_id", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "help": "学生姓名（中文 + 英文）", "hidden": false, "id": "et_sname", "max": 0, "min": 0, "name": "student_name", "pattern": "", "presentable": true, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "autogeneratePattern": "", "help": "年级（Form 1 / Form 2 / Form 3 …）", "hidden": false, "id": "et_grade", "max": 0, "min": 0, "name": "grade", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "help": "考试/学期", "hidden": false, "id": "et_term", "max": 0, "min": 0, "name": "term", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "help": "年份", "hidden": false, "id": "et_year", "max": null, "min": 0, "name": "year", "onlyInt": true, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "马来文 BM 目标分", "hidden": false, "id": "et_bm", "max": 100, "min": 0, "name": "bm", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "英文 BI 目标分", "hidden": false, "id": "et_bi", "max": 100, "min": 0, "name": "bi", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "华文 BC 目标分", "hidden": false, "id": "et_bc", "max": 100, "min": 0, "name": "bc", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "数学 MT 目标分", "hidden": false, "id": "et_mt", "max": 100, "min": 0, "name": "mt", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "科学 SC 目标分", "hidden": false, "id": "et_sc", "max": 100, "min": 0, "name": "sc", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "历史 SEJ 目标分", "hidden": false, "id": "et_sej", "max": 100, "min": 0, "name": "sej", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "地理 GEO 目标分", "hidden": false, "id": "et_geo", "max": 100, "min": 0, "name": "geo", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "autogeneratePattern": "", "help": "白板备注（如：过 50%）", "hidden": false, "id": "et_note", "max": 0, "min": 0, "name": "note", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "help": "软删除标记", "hidden": false, "id": "et_deleted", "name": "deleted", "presentable": false, "required": false, "system": false, "type": "bool" },
      { "hidden": false, "id": "autodate2990389176", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate3332085495", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "indexes": [], "created": "", "updated": ""
  })
  app.save(t)
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("exam_targets")) } catch (e) {}
})
