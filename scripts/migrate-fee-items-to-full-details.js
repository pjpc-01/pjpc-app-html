const { PocketBase } = require('pocketbase')

// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090')

async function migrateFeeItemsToFullDetails() {
  console.log('🔄 Starting migration: Converting fee_items from IDs to full details...')
  
  try {
    // Authenticate as admin (you may need to adjust this based on your setup)
    // await pb.admins.authWithPassword('your-email', 'your-password')
    
    // Get all student_fee_matrix records
    const records = await pb.collection('student_fee_matrix').getFullList(1000)
    console.log(`📊 Found ${records.length} student_fee_matrix records to migrate`)
    
    // Get all fee_items for reference
    const feeItems = await pb.collection('fee_items').getFullList(1000)
    console.log(`💰 Found ${feeItems.length} fee items for reference`)
    
    // Create a map for quick fee item lookup
    const feeItemsMap = new Map()
    feeItems.forEach(fee => {
      feeItemsMap.set(fee.id, fee)
    })
    
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const record of records) {
      try {
        console.log(`\n🔄 Processing record ${record.id}...`)
        
        let feeItemsData = []
        let needsUpdate = false
        
        // Parse existing fee_items
        if (record.fee_items) {
          if (typeof record.fee_items === 'string') {
            try {
              const parsed = JSON.parse(record.fee_items)
              if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].id) {
                  // Already in new format
                  console.log(`  ✅ Record ${record.id} already has full fee details, skipping...`)
                  skippedCount++
                  continue
                } else {
                  // Old format: array of IDs
                  feeItemsData = parsed.map(feeId => {
                    const fee = feeItemsMap.get(feeId)
                    if (fee) {
                      return {
                        id: feeId,
                        name: fee.name || 'Unknown Fee',
                        amount: fee.amount || 0,
                        category: fee.category || '未分类',
                        description: fee.description || '',
                        status: fee.status || 'active',
                        frequency: fee.frequency || 'one-time'
                      }
                    } else {
                      console.log(`  ⚠️  Fee item ${feeId} not found, creating placeholder...`)
                      return {
                        id: feeId,
                        name: 'Unknown Fee',
                        amount: 0,
                        category: '未分类',
                        description: '',
                        status: 'inactive',
                        frequency: 'one-time'
                      }
                    }
                  })
                  needsUpdate = true
                }
              }
            } catch (parseError) {
              console.log(`  ⚠️  Error parsing fee_items for record ${record.id}:`, parseError.message)
              errorCount++
              continue
            }
          } else if (Array.isArray(record.fee_items)) {
            if (record.fee_items.length > 0 && typeof record.fee_items[0] === 'object' && record.fee_items[0].id) {
              // Already in new format
              console.log(`  ✅ Record ${record.id} already has full fee details, skipping...`)
              skippedCount++
              continue
            } else {
              // Old format: array of IDs
              feeItemsData = record.fee_items.map(feeId => {
                const fee = feeItemsMap.get(feeId)
                if (fee) {
                  return {
                    id: feeId,
                    name: fee.name || 'Unknown Fee',
                    amount: fee.amount || 0,
                    category: fee.category || '未分类',
                    description: fee.description || '',
                    status: fee.status || 'active',
                    frequency: fee.frequency || 'one-time'
                  }
                } else {
                  console.log(`  ⚠️  Fee item ${feeId} not found, creating placeholder...`)
                  return {
                    id: feeId,
                    name: 'Unknown Fee',
                    amount: 0,
                    category: '未分类',
                    description: '',
                    status: 'inactive',
                    frequency: 'one-time'
                  }
                }
              })
              needsUpdate = true
            }
          }
        }
        
        if (needsUpdate) {
          console.log(`  🔄 Updating record ${record.id} with ${feeItemsData.length} fee items...`)
          
          // Update the record with full fee item details
          await pb.collection('student_fee_matrix').update(record.id, {
            fee_items: JSON.stringify(feeItemsData),
            updated: new Date().toISOString()
          })
          
          console.log(`  ✅ Successfully updated record ${record.id}`)
          updatedCount++
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing record ${record.id}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n🎉 Migration completed!')
    console.log(`📊 Summary:`)
    console.log(`  ✅ Updated: ${updatedCount} records`)
    console.log(`  ⏭️  Skipped (already migrated): ${skippedCount} records`)
    console.log(`  ❌ Errors: ${errorCount} records`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateFeeItemsToFullDetails()
  .then(() => {
    console.log('✅ Migration script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
