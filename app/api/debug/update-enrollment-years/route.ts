import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { dataType = 'primary' } = await request.json()
    const collectionName = dataType === 'secondary' ? 'secondary-students' : 'students'
    
    console.log(`Updating enrollment years for collection: ${collectionName}`)
    
    // 获取所有学生
    const querySnapshot = await getDocs(collection(db, collectionName))
    const batch = writeBatch(db)
    let updateCount = 0
    
    // 根据学生ID分配入学年份
    const enrollmentYearMap: Record<string, number> = {
      // 2018年入学 → 一年级
      'G01': 2018, 'G02': 2018, 'G03': 2018, 'G04': 2018, 'G05': 2018,
      // 2017年入学 → 二年级  
      'G06': 2017, 'G07': 2017, 'G08': 2017, 'G09': 2017, 'G10': 2017,
      // 2016年入学 → 三年级
      'G11': 2016, 'G12': 2016, 'G13': 2016, 'G14': 2016, 'G15': 2016,
      // 2015年入学 → 四年级
      'G16': 2015, 'G17': 2015, 'G18': 2015, 'G19': 2015, 'G20': 2015,
      // 2014年入学 → 五年级
      'G21': 2014, 'G22': 2014, 'G23': 2014, 'G24': 2014, 'G25': 2014,
      // 2013年入学 → 六年级
      'G26': 2013, 'G27': 2013, 'G28': 2013, 'G29': 2013, 'G30': 2013,
    }
    
    querySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      const studentId = data.id || docSnapshot.id
      
      // 如果学生ID在映射中，更新入学年份
      if (enrollmentYearMap[studentId]) {
        const enrollmentYear = enrollmentYearMap[studentId]
        batch.update(doc(db, collectionName, docSnapshot.id), {
          enrollmentYear: enrollmentYear,
          updatedAt: new Date()
        })
        updateCount++
        console.log(`Updated student ${studentId} with enrollment year: ${enrollmentYear}`)
      }
    })
    
    // 提交批量更新
    await batch.commit()
    
    console.log(`Successfully updated ${updateCount} students with enrollment years`)
    
    return NextResponse.json({
      success: true,
      message: `成功更新 ${updateCount} 名学生的入学年份`,
      updatedCount: updateCount,
      collection: collectionName
    })
    
  } catch (error) {
    console.error('Error updating enrollment years:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 