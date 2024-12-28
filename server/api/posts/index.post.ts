import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// ตรวจสอบการตั้งค่า Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("Environment variables SUPABASE_URL and SUPABASE_KEY are required.")
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default defineEventHandler(async (event) => {
    try {
        const body = await readMultipartFormData(event)

        // อ่านข้อมูลจากฟอร์ม
        const title = body?.find(item => item.name === "title")?.data?.toString()
        const content = body?.find(item => item.name === "content")?.data?.toString()
        const image = body?.find(item => item.name === "image")

        console.log("Title:", title)
        console.log("Content:", content)
        console.log("Image:", image)

        // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
        if (!title || !content || !image?.data || !image.filename)
            throw createError({
                statusCode: 400,
                message: "Missing required fields"
            })

        // ตรวจสอบชนิดไฟล์
        const ext = path.extname(image.filename).toLowerCase()
        console.log("File Extension:", ext)

        if (![ ".png", ".jpg", ".jpeg" ].includes(ext))
            throw createError({
                statusCode: 400,
                message: "Invalid file type"
            })

        // ตรวจสอบขนาดไฟล์
        if (image.data.length > 5 * 1024 * 1024)  // 5MB
            throw createError({
                statusCode: 400,
                message: "File too large"
            })

        // สร้างชื่อไฟล์ที่ไม่ซ้ำ
        const uniqueFileName = `${uuidv4()}${ext}`

        // อัพโหลดไฟล์ไปยัง Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('Uploads')  // ใช้ชื่อ store 'Uploads' แทน
            .upload(uniqueFileName, image.data, {
                contentType: image.type,
            })

        // หากอัพโหลดไฟล์ไม่สำเร็จ
        if (uploadError) {
            console.error("Upload Error:", uploadError.message)
            throw createError({
                statusCode: 500,
                message: `Failed to upload file: ${uploadError.message}`
            })
        }

        // ดึง URL ของไฟล์ที่อัปโหลด
        const { data: publicUrlData } = supabase.storage.from('Uploads').getPublicUrl(uniqueFileName)


        // ตรวจสอบว่ามี publicUrl หรือไม่
        if (!publicUrlData?.publicUrl) {
            console.error("Failed to get public URL")
            throw createError({
                statusCode: 500,
                message: "Failed to get public URL"
            })
        }

        const publicUrl = publicUrlData.publicUrl
        console.log("Public URL:", publicUrl)


        // บันทึกข้อมูลโพสต์ลงในฐานข้อมูล
        const createPost = await prisma.post.create({
            data: {
                title,
                content,
                imageUrl: publicUrl  // เก็บ URL ของไฟล์ที่อัพโหลด
            }
        })

        console.log("Created Post:", createPost)

        // ส่งข้อมูลที่ถูกสร้างกลับไป
        return createPost

    } catch (err) {
        if (err instanceof Error) {
            console.error("Error:", err.message)
            throw createError({
                statusCode: (err as any).statusCode || 500,
                message: err.message || "Internal Server Error"
            })
        } else {
            console.error("Unknown error occurred")
            throw createError({
                statusCode: 500,
                message: "Unknown error occurred."
            })
        }
    }
})
// Project001