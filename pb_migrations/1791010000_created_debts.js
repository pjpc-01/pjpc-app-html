/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const debts = new Collection({
    "id": "pbc_debts00001",
    "name": "debts",
    "type": "base",
    "system": false,
    "listRule": null, "viewRule": null, "createRule": null, "updateRule": null, "deleteRule": null,
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "help": "", "hidden": false, "id": "text3208210256", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "autogeneratePattern": "", "help": "债务名称（如：BSN 装修贷款）", "hidden": false, "id": "db_name", "max": 0, "min": 0, "name": "name", "pattern": "", "presentable": true, "primaryKey": false, "required": true, "system": false, "type": "text" },
      { "autogeneratePattern": "", "help": "类型：自由填写（历史值会自动联想）", "hidden": false, "id": "db_type", "max": 0, "min": 0, "name": "type", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "help": "本金（总欠款）", "hidden": false, "id": "db_principal", "max": null, "min": 0, "name": "principal", "onlyInt": false, "presentable": false, "required": true, "system": false, "type": "number" },
      { "help": "每月应还多少", "hidden": false, "id": "db_monthly", "max": null, "min": 0, "name": "monthlyAmount", "onlyInt": false, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "每月几号还（1-31）", "hidden": false, "id": "db_payday", "max": 31, "min": 1, "name": "paymentDay", "onlyInt": true, "presentable": false, "required": false, "system": false, "type": "number" },
      { "help": "开始日期", "hidden": false, "id": "db_start", "max": "", "min": "", "name": "startDate", "presentable": false, "required": false, "system": false, "type": "date" },
      { "help": "还清到期日（可选）", "hidden": false, "id": "db_due", "max": "", "min": "", "name": "dueDate", "presentable": false, "required": false, "system": false, "type": "date" },
      { "help": "", "hidden": false, "id": "db_status", "maxSelect": 1, "name": "status", "presentable": false, "required": false, "system": false, "type": "select", "values": ["active", "settled", "paused"] },
      { "autogeneratePattern": "", "help": "备注", "hidden": false, "id": "db_note", "max": 0, "min": 0, "name": "note", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "autogeneratePattern": "", "help": "凭证号（可选）", "hidden": false, "id": "db_voucher", "max": 0, "min": 0, "name": "voucher_no", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "help": "软删除标记", "hidden": false, "id": "db_deleted", "name": "deleted", "presentable": false, "required": false, "system": false, "type": "bool" },
      { "hidden": false, "id": "autodate2990389176", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate3332085495", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "indexes": [], "created": "", "updated": ""
  })
  app.save(debts)

  const pays = new Collection({
    "id": "pbc_debtpay0001",
    "name": "debt_payments",
    "type": "base",
    "system": false,
    "listRule": null, "viewRule": null, "createRule": null, "updateRule": null, "deleteRule": null,
    "fields": [
      { "autogeneratePattern": "[a-z0-9]{15}", "help": "", "hidden": false, "id": "text3208210256", "max": 15, "min": 15, "name": "id", "pattern": "^[a-z0-9]+$", "presentable": false, "primaryKey": true, "required": true, "system": true, "type": "text" },
      { "cascadeDelete": false, "collectionId": "pbc_debts00001", "help": "哪一笔债务", "hidden": false, "id": "dp_debt", "maxSelect": 1, "minSelect": 0, "name": "debtId", "presentable": false, "required": true, "system": false, "type": "relation" },
      { "help": "还款日期", "hidden": false, "id": "dp_date", "max": "", "min": "", "name": "date", "presentable": false, "required": true, "system": false, "type": "date" },
      { "help": "还款金额", "hidden": false, "id": "dp_amt", "max": null, "min": 0, "name": "amount", "onlyInt": false, "presentable": false, "required": true, "system": false, "type": "number" },
      { "autogeneratePattern": "", "help": "备注", "hidden": false, "id": "dp_note", "max": 0, "min": 0, "name": "note", "pattern": "", "presentable": false, "primaryKey": false, "required": false, "system": false, "type": "text" },
      { "help": "软删除标记", "hidden": false, "id": "dp_deleted", "name": "deleted", "presentable": false, "required": false, "system": false, "type": "bool" },
      { "hidden": false, "id": "autodate2990389176", "name": "created", "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "type": "autodate" },
      { "hidden": false, "id": "autodate3332085495", "name": "updated", "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "type": "autodate" }
    ],
    "indexes": [], "created": "", "updated": ""
  })
  app.save(pays)
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("debt_payments")) } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("debts")) } catch (e) {}
})
