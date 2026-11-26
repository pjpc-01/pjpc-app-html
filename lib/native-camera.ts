"use client"

import { isNativeApp, nativePlugin } from "@/lib/native-app"

/**
 * 拍照 / 选图（只在装好的 App 里走原生相机）。
 *
 * 浏览器里返回 null，调用方继续用原本的 <input type="file">。
 * 原生的好处：直接开相机（不用先过一遍文件选择器），拿到的 File 跟原来上传逻辑完全兼容。
 */
export async function takePhoto(source: "prompt" | "camera" | "photos" = "prompt"): Promise<File | null> {
  if (!isNativeApp()) return null
  const Camera = nativePlugin("Camera")
  if (!Camera?.getPhoto) return null

  const photo = await Camera.getPhoto({
    quality: 82,
    width: 1600,
    allowEditing: false,
    resultType: "base64",
    source: source === "camera" ? "CAMERA" : source === "photos" ? "PHOTOS" : "PROMPT",
    saveToGallery: false,
    promptLabelHeader: "上传照片",
    promptLabelPhoto: "从相册选",
    promptLabelPicture: "拍照",
    promptLabelCancel: "取消",
  }).catch((e: any) => {
    // 用户点取消时插件会 reject，这不是错误
    if (String(e?.message || "").toLowerCase().includes("cancel")) return null
    throw e
  })

  if (!photo?.base64String) return null
  const format = String(photo.format || "jpeg")
  const bin = atob(photo.base64String)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const mime = `image/${format === "jpg" ? "jpeg" : format}`
  return new File([bytes], `photo-${Date.now()}.${format}`, { type: mime })
}
