import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// ฟังก์ชันสำหรับการอัปเดตโพสต์
export default defineEventHandler(async (event) => {
    try {
        // อ่านข้อมูลฟอร์มแบบ Multipart
        const body = await readMultipartFormData(event)

        // ดึงค่าจากฟอร์ม
        const title = body?.find(item => item.name === "title")?.data?.toString()
        const content = body?.find(item => item.name === "content")?.data?.toString()
        const image = body?.find(item => item.name === "image")
        const postId = Number(event.context.params?.id) // ดึง ID ของโพสต์ที่ต้องการอัปเดต

        // ตรวจสอบว่าข้อมูล title และ content มีค่าหรือไม่
        if (!title || !content) {
            throw createError({ statusCode: 400, message: "Missing required fields" })
        }

        const updatedData: any = { title, content } // เตรียมข้อมูลสำหรับอัปเดต

        // ตรวจสอบว่ามีการอัปโหลดรูปภาพใหม่หรือไม่
        if (image?.data && image.filename) {
            const ext = path.extname(image.filename).toLowerCase()

            // ตรวจสอบประเภทไฟล์
            if (![".png", ".jpg", ".jpeg"].includes(ext)) {
                throw createError({ statusCode: 400, message: "Invalid file type" })
            }

            // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
            if (image.data.length > 5 * 1024 * 1024) {
                throw createError({ statusCode: 400, message: "File too large" })
            }

            const uploadsDir = path.join(process.cwd(), "public/uploads")
            await fs.mkdir(uploadsDir, { recursive: true }) // สร้างโฟลเดอร์ถ้ายังไม่มี

            // สร้างชื่อไฟล์ใหม่และบันทึกลงในระบบ
            const newFileName = `${uuidv4()}${ext}`
            const filePath = path.join(uploadsDir, newFileName)
            await fs.writeFile(filePath, image.data)

            // ลบรูปภาพเก่าถ้ามี
            const existingPost = await prisma.post.findUnique({ where: { id: postId } })
            if (existingPost?.imageUrl) {
                const oldFilePath = path.join(process.cwd(), existingPost.imageUrl)
                await fs.unlink(oldFilePath).catch(() => console.log("Old image not found."))
            }

            // อัปเดต URL รูปภาพใหม่
            updatedData.imageUrl = `/uploads/${newFileName}`
        }

        // อัปเดตข้อมูลโพสต์ในฐานข้อมูล
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: updatedData
        })

        // ส่งข้อมูลโพสต์ที่อัปเดตกลับไป
        return updatedPost

    } catch (err) {
        // จัดการข้อผิดพลาด
        if (err instanceof Error) {
            throw createError({
                statusCode: (err as any).statusCode || 500,
                message: err.message || "Internal Server Error"
            })
        } else {
            throw createError({
                statusCode: 500,
                message: "Unknown error occurred."
            })
        }
    }
})
