/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ez1iq2paxliaj2b")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX idx_invoiceNumber_unique ON invoices (invoiceNumber)",
      "CREATE INDEX idx_invoices_status ON invoices (status)",
      "CREATE INDEX idx_invoices_student ON invoices (studentId)",
      "CREATE INDEX idx_invoices_period ON invoices (period)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ez1iq2paxliaj2b")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_invoiceNumber_unique` ON `invoices` (`invoiceNumber`)"
    ]
  }, collection)

  return app.save(collection)
})
