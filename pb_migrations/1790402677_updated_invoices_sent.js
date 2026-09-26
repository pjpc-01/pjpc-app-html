/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ez1iq2paxliaj2b")

  // add field: sent (是否已发送给家长)
  collection.fields.addAt(21, new Field({
    "help": "是否已发送发票给家长",
    "hidden": false,
    "id": "bool_sent_inv01",
    "name": "sent",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field: sent_at (发送时间)
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "help": "发送时间",
    "hidden": false,
    "id": "text_sent_at01",
    "max": 0,
    "min": 0,
    "name": "sent_at",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ez1iq2paxliaj2b")
  collection.fields.removeById("bool_sent_inv01")
  collection.fields.removeById("text_sent_at01")
  return app.save(collection)
})
