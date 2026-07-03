import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

const PB_DATA_DIR = path.join(process.cwd(), "pb_data")
const BACKUP_DIR = path.join(PB_DATA_DIR, "backups")
const ONEDRIVE_BACKUP_DIR = "/mnt/c/Users/PJPC/OneDrive/PJPC_Backups"

// GET: list existing backups
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const download = url.searchParams.get("download")

    // Download a specific backup
    if (download) {
      const filePath = path.join(BACKUP_DIR, download)
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Backup not found" }, { status: 404 })
      }
      const fileBuffer = fs.readFileSync(filePath)
      const isTarGz = download.endsWith(".tar.gz")
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": isTarGz ? "application/gzip" : "application/zip",
          "Content-Disposition": `attachment; filename="${download}"`,
        },
      })
    }

    // List backups
    if (!fs.existsSync(BACKUP_DIR)) {
      return NextResponse.json({ backups: [] })
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith(".tar.gz") || f.endsWith(".zip"))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f))
        return {
          name: f,
          size: stat.size,
          sizeFormatted: formatSize(stat.size),
          created: stat.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    return NextResponse.json({ backups: files })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: create a new backup
export async function POST(request: NextRequest) {
  try {
    // Ensure backup directories exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    // Create tar.gz archive of pb_data (excluding backups and logs.db)
    const backupName = `pjpc_backup_${timestamp}.tar.gz`
    const backupPath = path.join(BACKUP_DIR, backupName)

    const { stdout, stderr } = await execAsync(
      `cd ${path.join(process.cwd())} && tar -czf "${backupPath}" --exclude="pb_data/backups" --exclude="pb_data/logs.db*" pb_data/`,
      { timeout: 300000 }
    )

    const stat = fs.statSync(backupPath)

    // Also copy to OneDrive if available
    let oneDrivePath: string | null = null
    if (fs.existsSync("/mnt/c/Users/PJPC/OneDrive")) {
      try {
        if (!fs.existsSync(ONEDRIVE_BACKUP_DIR)) {
          fs.mkdirSync(ONEDRIVE_BACKUP_DIR, { recursive: true })
        }
        fs.copyFileSync(backupPath, path.join(ONEDRIVE_BACKUP_DIR, backupName))
        oneDrivePath = path.join(ONEDRIVE_BACKUP_DIR, backupName)
      } catch (e) {
        console.warn("OneDrive copy failed (non-critical):", e)
      }
    }

    // Clean up old backups: keep last 7 locally, last 30 on OneDrive
    cleanOldBackups(BACKUP_DIR, 7)
    if (fs.existsSync(ONEDRIVE_BACKUP_DIR)) {
      cleanOldBackups(ONEDRIVE_BACKUP_DIR, 30)
    }

    return NextResponse.json({
      success: true,
      backup: {
        name: backupName,
        size: stat.size,
        sizeFormatted: formatSize(stat.size),
        created: stat.mtime.toISOString(),
        localPath: backupPath,
        oneDrivePath,
      },
    })
  } catch (error: any) {
    console.error("Backup error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function cleanOldBackups(dir: string, keepCount: number) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith(".zip"))
      .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)

    for (let i = keepCount; i < files.length; i++) {
      fs.unlinkSync(path.join(dir, files[i].name))
      console.log(`Cleaned old backup: ${files[i].name}`)
    }
  } catch (e) {
    // Directory might not exist yet
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
