/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2631945072")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "djvae07iufj859g",
    "help": "",
    "hidden": false,
    "id": "80htee7x",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "teacher_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "c29a0tfz",
    "max": 0,
    "min": 0,
    "name": "teacher_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "v3jbprlt",
    "max": 0,
    "min": 0,
    "name": "subject",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "9wk5hsdy",
    "max": 0,
    "min": 0,
    "name": "grade",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "kc2xpk2c",
    "max": "",
    "min": "",
    "name": "date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "help": "",
    "hidden": false,
    "id": "70vhz727",
    "maxSelect": 1,
    "name": "assessment_period",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "first",
      "second",
      "third"
    ]
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "cr5by59i",
    "max": 0,
    "min": 0,
    "name": "teaching_content",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "help": "",
    "hidden": false,
    "id": "mw7lb8zm",
    "maxSelect": 1,
    "name": "progress_status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "on_track",
      "ahead",
      "behind"
    ]
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "di0nj8vp",
    "max": 0,
    "min": 0,
    "name": "progress_reason",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "help": "",
    "hidden": false,
    "id": "6lk0egvt",
    "maxSize": 0,
    "name": "student_performances",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "2t8otsx5",
    "max": 0,
    "min": 0,
    "name": "excellent_students",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "tuaxo41f",
    "max": 0,
    "min": 0,
    "name": "attention_students",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "help": "",
    "hidden": false,
    "id": "eh9mu1tf",
    "maxSize": 0,
    "name": "common_problems",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "v941puei",
    "max": 0,
    "min": 0,
    "name": "other_problem",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "n71necx4",
    "max": 0,
    "min": 0,
    "name": "biggest_progress",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "0jwv7wv5",
    "max": 0,
    "min": 0,
    "name": "main_challenge",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "odfvku7k",
    "max": 0,
    "min": 0,
    "name": "teaching_effectiveness",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "help": "",
    "hidden": false,
    "id": "cjzd564u",
    "maxSize": 0,
    "name": "next_plan_options",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "qp58y8dc",
    "max": 0,
    "min": 0,
    "name": "next_plan_other",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "erm7b4lj",
    "max": 0,
    "min": 0,
    "name": "assistance_needed",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "g206qz4a",
    "max": 0,
    "min": 0,
    "name": "teacher_signature",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "xe8m8az6",
    "max": 0,
    "min": 0,
    "name": "reviewer",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "help": "",
    "hidden": false,
    "id": "ayeo9ihw",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "draft",
      "submitted",
      "reviewed"
    ]
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "htoe6ui1",
    "max": 0,
    "min": 0,
    "name": "center",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2631945072")

  // remove field
  collection.fields.removeById("80htee7x")

  // remove field
  collection.fields.removeById("c29a0tfz")

  // remove field
  collection.fields.removeById("v3jbprlt")

  // remove field
  collection.fields.removeById("9wk5hsdy")

  // remove field
  collection.fields.removeById("kc2xpk2c")

  // remove field
  collection.fields.removeById("70vhz727")

  // remove field
  collection.fields.removeById("cr5by59i")

  // remove field
  collection.fields.removeById("mw7lb8zm")

  // remove field
  collection.fields.removeById("di0nj8vp")

  // remove field
  collection.fields.removeById("6lk0egvt")

  // remove field
  collection.fields.removeById("2t8otsx5")

  // remove field
  collection.fields.removeById("tuaxo41f")

  // remove field
  collection.fields.removeById("eh9mu1tf")

  // remove field
  collection.fields.removeById("v941puei")

  // remove field
  collection.fields.removeById("n71necx4")

  // remove field
  collection.fields.removeById("0jwv7wv5")

  // remove field
  collection.fields.removeById("odfvku7k")

  // remove field
  collection.fields.removeById("cjzd564u")

  // remove field
  collection.fields.removeById("qp58y8dc")

  // remove field
  collection.fields.removeById("erm7b4lj")

  // remove field
  collection.fields.removeById("g206qz4a")

  // remove field
  collection.fields.removeById("xe8m8az6")

  // remove field
  collection.fields.removeById("ayeo9ihw")

  // remove field
  collection.fields.removeById("htoe6ui1")

  return app.save(collection)
})
