// Enhanced debug logging utility for troubleshooting PocketBase issues
export const debugLog = (message: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') => {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [DEBUG]`
  
  switch (level) {
    case 'error':
      console.error(`${prefix} ❌ ${message}`, data)
      break
    case 'warn':
      console.warn(`${prefix} ⚠️ ${message}`, data)
      break
    default:
      console.log(`${prefix} ℹ️ ${message}`, data)
  }
}

export const debugPocketBase = {
  instance: (pb: any) => {
    debugLog('🔍 PocketBase Instance Debug', {
      baseURL: pb.baseUrl,
      authStore: pb.authStore,
      collections: typeof pb.collections
    })
  },
  
  collection: async (pb: any, collectionName: string) => {
    try {
      debugLog(`🔍 Checking collection: ${collectionName}`)
      const collection = await pb.collections.getOne(collectionName)
      debugLog(`✅ Collection ${collectionName} found:`, {
        name: collection.name,
        type: collection.type,
        schema: collection.schema
      })
      return collection
    } catch (error: any) {
      debugLog(`❌ Failed to get collection ${collectionName}:`, {
        message: error.message,
        status: error.status
      }, 'error')
      throw error
    }
  },
  
  testCollectionFields: async (pb: any, collectionName: string) => {
    try {
      debugLog(`🔍 Testing collection: ${collectionName}`)
      const testRecord = await pb.collection(collectionName).getList(1, 1, {})
      if (testRecord.items.length > 0) {
        const record = testRecord.items[0]
        const fields = Object.keys(record)
        debugLog(`✅ Collection ${collectionName} fields:`, fields)
        const relationFields = fields.filter(field => 
          typeof record[field] === 'string' && 
          record[field].length > 0 &&
          !field.includes('created') &&
          !field.includes('updated') &&
          !field.includes('id')
        )
        debugLog(`🔗 Potential relation fields in ${collectionName}:`, relationFields)
        return { fields, relationFields, sampleRecord: record }
      } else {
        debugLog(`⚠️ Collection ${collectionName} is empty`)
        return { fields: [], relationFields: [], sampleRecord: null }
      }
    } catch (error: any) {
      debugLog(`❌ Failed to test collection ${collectionName}:`, {
        message: error.message,
        status: error.status
      }, 'error')
      throw error
    }
  },
  
  analyzePaymentsCollection: async (pb: any) => {
    try {
      debugLog('🔍 Analyzing payments collection structure...')
      
      // Test 1: Basic collection access
      const basicTest = await pb.collection('payments').getList(1, 1, {})
      debugLog('✅ Basic collection access works')
      
      if (basicTest.items.length === 0) {
        debugLog('⚠️ Collection is empty - no records to analyze')
        return { success: false, reason: 'empty_collection' }
      }
      
      const sampleRecord = basicTest.items[0]
      debugLog('📋 Sample record structure:', {
        id: sampleRecord.id,
        fields: Object.keys(sampleRecord),
        created: sampleRecord.created,
        updated: sampleRecord.updated
      })
      
      // Test 2: Look for potential relation fields
      const potentialRelations = Object.keys(sampleRecord).filter(field => {
        const value = sampleRecord[field]
        return (
          typeof value === 'string' && 
          value.length > 0 &&
          !field.includes('created') &&
          !field.includes('updated') &&
          !field.includes('id') &&
          field !== 'created' &&
          field !== 'updated'
        )
      })
      
      debugLog('🔗 Potential relation fields found:', potentialRelations)
      
      // Test 3: Check if these fields actually contain valid IDs
      const validRelations = []
      for (const field of potentialRelations) {
        const value = sampleRecord[field]
        if (value && value.length > 0) {
          validRelations.push({
            field,
            value,
            looksLikeId: /^[a-zA-Z0-9]{15,}$/.test(value) // PocketBase ID pattern
          })
        }
      }
      
      debugLog('✅ Valid relation candidates:', validRelations)
      
      // Test 4: Try to expand each potential relation field
      const expandResults = []
      for (const relation of validRelations) {
        try {
          debugLog(`🧪 Testing expand with field: ${relation.field}`)
          const expandTest = await pb.collection('payments').getList(1, 1, {
            expand: relation.field
          })
          expandResults.push({
            field: relation.field,
            success: true,
            result: expandTest
          })
          debugLog(`✅ Expand with ${relation.field} works!`)
        } catch (error: any) {
          expandResults.push({
            field: relation.field,
            success: false,
            error: {
              message: error.message,
              status: error.status
            }
          })
          debugLog(`❌ Expand with ${relation.field} failed:`, error.message)
        }
      }
      
      return {
        success: true,
        basicAccess: true,
        sampleRecord: {
          id: sampleRecord.id,
          fields: Object.keys(sampleRecord)
        },
        potentialRelations,
        validRelations,
        expandResults
      }
      
    } catch (error: any) {
      debugLog('❌ Failed to analyze payments collection:', {
        message: error.message,
        status: error.status
      }, 'error')
      return {
        success: false,
        error: {
          message: error.message,
          status: error.status
        }
      }
    }
  },
  
  request: (collectionName: string, params: any) => {
    debugLog('🔍 Request Debug for ' + collectionName, {
      collection: collectionName,
      parameters: params,
      expandFields: params.expand ? (Array.isArray(params.expand) ? params.expand : [params.expand]) : [],
      sortField: params.sort,
      filter: params.filter
    })
    debugLog('Making PocketBase request...')
  },
  
  response: (collectionName: string, result: any) => {
    debugLog('✅ Response Debug for ' + collectionName, {
      totalItems: result.totalItems,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
      itemsCount: result.items?.length || 0
    })
  },
  
  error: (error: any, context: string) => {
    debugLog(`❌ Error in ${context}:`, {
      message: error.message,
      status: error.status,
      data: error.data,
      name: error.name
    }, 'error')
  },
  
  analyze400Error: (error: any) => {
    debugLog('⚠️ 🔍 400 Bad Request Analysis', {
      possibleCauses: [
        'Invalid expand field name',
        'Relation field does not exist in collection schema',
        'Collection permissions do not allow expand operations',
        'Invalid parameter values (sort, filter, etc.)',
        'Collection schema mismatch',
        'API rules configuration issue',
        'Field name conflicts between collections'
      ],
      recommendations: [
        'Check collection schema for correct relation field names',
        'Verify API rules allow expand operations',
        'Test with minimal parameters first',
        'Check PocketBase admin panel for collection configuration',
        'Review relation field setup between collections',
        'Check for field name conflicts between related collections'
      ]
    }, 'warn')
    
    debugLog('❌ Error details from PocketBase:', {
      data: error.data,
      message: error.message,
      status: error.status
    }, 'error')
  },
  
  testFieldConflicts: async (pb: any, collectionName: string, relatedCollectionName: string) => {
    try {
      debugLog(`🔍 Testing for field conflicts between ${collectionName} and ${relatedCollectionName}...`)
      
      // Get fields from both collections
      const collection1 = await pb.collection(collectionName).getList(1, 1, {})
      const collection2 = await pb.collection(relatedCollectionName).getList(1, 1, {})
      
      if (collection1.items.length === 0 || collection2.items.length === 0) {
        debugLog('⚠️ One or both collections are empty')
        return { hasConflicts: false, conflictingFields: [] }
      }
      
      const fields1 = Object.keys(collection1.items[0])
      const fields2 = Object.keys(collection1.items[0])
      
      debugLog(`📋 ${collectionName} fields:`, fields1)
      debugLog(`📋 ${relatedCollectionName} fields:`, fields2)
      
      // Find conflicting fields
      const conflictingFields = fields1.filter(field => fields2.includes(field))
      
      if (conflictingFields.length > 0) {
        debugLog('⚠️ Field conflicts detected:', conflictingFields)
        
        // Analyze each conflicting field
        const conflictAnalysis = conflictingFields.map(field => {
          const value1 = collection1.items[0][field]
          const value2 = collection2.items[0][field]
          
          return {
            field,
            [`${collectionName}_value`]: value1,
            [`${relatedCollectionName}_value`]: value2,
            [`${collectionName}_type`]: typeof value1,
            [`${relatedCollectionName}_type`]: typeof value2,
            isSameType: typeof value1 === typeof value2
          }
        })
        
        debugLog('🔍 Conflict analysis:', conflictAnalysis)
        
        return {
          hasConflicts: true,
          conflictingFields,
          conflictAnalysis,
          recommendations: [
            'Consider renaming conflicting fields in one collection',
            'Use field aliasing in your expand queries',
            'Check if the conflict is causing expand issues'
          ]
        }
      } else {
        debugLog('✅ No field conflicts detected')
        return { hasConflicts: false, conflictingFields: [] }
      }
      
    } catch (error: any) {
      debugLog(`❌ Error testing field conflicts:`, {
        message: error.message,
        status: error.status
      }, 'error')
      return { hasConflicts: false, conflictingFields: [], error: error.message }
    }
  }
}
