"use client"

import React from 'react'
import { User, Phone, MapPin, Calendar, School, Heart, Car, FileText } from 'lucide-react'

export default function PrintableEnrollmentForm() {
  return (
    <div className="bg-white p-8 text-black font-serif" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      {/* Header Section */}
      <div className="text-center border-b-4 border-black pb-6 mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Student Enrollment Form</h1>
        <h2 className="text-2xl font-bold mb-4">学生入学申请表</h2>
        <div className="flex justify-between text-sm italic">
          <span>Registration Date / 注册日期: ____________________</span>
          <span>Student ID / 学号: ____________________</span>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="mb-8">
        <h3 className="text-lg font-bold bg-gray-200 p-1 px-2 mb-4 border-l-4 border-black">
          1. Basic Information / 基础信息
        </h3>
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Full Name (as per NRIC/Passport) / 学生全名</label>
            <div className="border-b border-black h-8"></div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Date of Birth / 出生日期</label>
            <div className="border-b border-black h-8"></div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Gender / 性别</label>
            <div className="flex gap-4 h-8 items-end">
              <span>Male / 男 [ ]</span>
              <span>Female / 女 [ ]</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">NRIC / Passport No / 身份证/护照号码</label>
            <div className="border-b border-black h-8"></div>
          </div>
        </div>
      </div>

      {/* Section 2: Parent/Guardian Contact */}
      <div className="mb-8">
        <h3 className="text-lg font-bold bg-gray-200 p-1 px-2 mb-4 border-l-4 border-black">
          2. Parent/Guardian Contact / 家长联系方式
        </h3>
        <div className="grid grid-cols-1 gap-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Parent/Guardian Full Name / 家长全名</label>
            <div className="border-b border-black h-8"></div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Father's Phone / 父亲电话</label>
              <div className="border-b border-black h-8"></div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Mother's Phone / 母亲电话</label>
              <div className="border-b border-black h-8"></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Home Address / 家庭住址</label>
            <div className="border-b border-black h-8"></div>
            <div className="border-b border-black h-8"></div>
          </div>
        </div>
      </div>

      {/* Section 3: Academic Details */}
      <div className="mb-8">
        <h3 className="text-lg font-bold bg-gray-200 p-1 px-2 mb-4 border-l-4 border-black">
          3. Academic Details / 学校详情
        </h3>
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Current School / 就读学校</label>
            <div className="border-b border-black h-8"></div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Current Grade/Standard / 年级</label>
            <div className="border-b border-black h-8"></div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Education Level / 教育阶段</label>
            <div className="flex gap-4 h-8 items-end">
              <span>Primary / 小学 [ ]</span>
              <span>Secondary / 中学 [ ]</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Service Required / 服务类型</label>
            <div className="flex gap-4 h-8 items-end">
              <span>Afterschool / 安亲班 [ ]</span>
              <span>Tuition / 补习班 [ ]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Pickup & Security */}
      <div className="mb-8">
        <h3 className="text-lg font-bold bg-gray-200 p-1 px-2 mb-4 border-l-4 border-black">
          4. Pickup & Security / 接送与安全
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-end">
            <label className="text-sm font-semibold">Primary Pickup Method / 接送方式:</label>
            <span className="text-xs">Parent [ ] Guardian [ ] Authorized [ ] Public [ ] Walking [ ]</span>
          </div>
          
          <div className="space-y-4 mt-4">
            <p className="text-sm font-bold underline">Authorized Pickup Persons / 授权接送人员 (Max 3):</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500">Name / 姓名 {i}</label>
                  <div className="border-b border-black h-6"></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500">Relation / 关系 {i}</label>
                  <div className="border-b border-black h-6"></div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500">Phone / 电话 {i}</label>
                  <div className="border-b border-black h-6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: Health & Medical */}
      <div className="mb-8">
        <h3 className="text-lg font-bold bg-gray-200 p-1 px-2 mb-4 border-l-4 border-black">
          5. Health & Medical / 健康备注
        </h3>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Medical Conditions / Allergies / Health Notes / 健康备注/过敏记录</label>
          <div className="border border-black h-24 p-2 text-xs text-gray-400 italic">
            Please specify any medical conditions or allergies the center should be aware of...
          </div>
        </div>
      </div>

      {/* Footer: Signatures */}
      <div className="mt-12 grid grid-cols-2 gap-12 text-center">
        <div className="flex flex-col gap-4">
          <div className="border-b border-black h-12"></div>
          <p className="text-sm font-bold">Parent/Guardian Signature / 家长签名</p>
          <p className="text-xs text-gray-500">Date / 日期: ____________________</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="border-b border-black h-12"></div>
          <p className="text-sm font-bold">Admin Signature / 管理员签名</p>
          <p className="text-xs text-gray-500">Date / 日期: ____________________</p>
        </div>
      </div>

      {/* Print Instruction */}
      <div className="hidden print:block text-center text-[10px] text-gray-400 mt-8">
        Printed from PJPC Management System - Enrollment Module
      </div>
    </div>
  )
}
