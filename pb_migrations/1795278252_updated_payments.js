/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_payments_invoice ON payments (invoiceId)",
      "CREATE INDEX idx_payments_date ON payments (date)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("9a0riqrdo718qfw")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
