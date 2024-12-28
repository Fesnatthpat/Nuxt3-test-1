import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// เริ่มต้นการเชื่อมต่อกับ Supabase
// ตรวจสอบการตั้งค่า Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("Environment variables SUPABASE_URL and SUPABASE_KEY are required.")
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id') // ดึง id จาก route

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Invalid id'
        })
    }

    // 1. ดึงข้อมูล Post ก่อนเพื่อลบรูปภาพ
    const post = await prisma.post.findUnique({
        where: { id: Number(id) }
    })

    if (!post) {
        throw createError({
            statusCode: 404,
            message: 'Post not found'
        })
    }

    // 2. ลบรูปภาพจาก Supabase storage
    const imageUrl = post.imageUrl
    if (imageUrl) {
        const imageName = imageUrl.split('/').pop() || ''
        try {
            const { data, error } = await supabase.storage.from('Uploads').remove([imageName])
            if (error) throw new Error(error.message)
        } catch (error) {
            console.warn('Failed to delete image from Supabase:', error)
        }
    }

    // 3. ลบ Post ออกจากฐานข้อมูล
    const deletedPost = await prisma.post.delete({
        where: { id: Number(id) },
    })

    return {
        message: 'Post and associated image deleted successfully',
        deletedPost
    }
})
