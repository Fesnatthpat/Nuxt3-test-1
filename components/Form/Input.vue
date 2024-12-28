<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { type Post } from '~~/types/post'

const posts = ref<Post[]>([])
const title = ref('')
const content = ref('')
const image = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const imageError = ref<string | null>(null) // เพิ่มสำหรับข้อผิดพลาดการแสดงภาพ
const isSubmitting = ref(false) // For submit button loading state
const uploadProgress = ref(0) // Upload progress feedback

const fetchPosts = async () => {
    try {
        posts.value = await $fetch<Post[]>('/api/posts')
    } catch (error) {
        console.error('Error fetching posts:', error)
    }
}

const handleFileChange = (e: Event) => {
    const fileInput = e.target as HTMLInputElement
    const file = fileInput.files?.[ 0 ]

    if (file) {
        const allowedTypes = [ 'image/jpeg', 'image/png', 'image/gif' ]

        // ตรวจสอบประเภทไฟล์
        if (!allowedTypes.includes(file.type)) {
            imageError.value = 'Only image files (JPEG, PNG, GIF) are allowed.'
            resetImage()
            return
        }

        // ตรวจสอบขนาดไฟล์
        if (file.size > 5 * 1024 * 1024) {
            imageError.value = 'File size exceeds the 5MB limit.'
            resetImage()
            return
        }

        // รีเซ็ตข้อผิดพลาดเมื่อไฟล์ถูกต้อง
        imageError.value = null
        image.value = file

        const reader = new FileReader()
        reader.onload = () => {
            imagePreview.value = reader.result as string
        }
        reader.readAsDataURL(file)
    } else {
        resetImage()
    }
}

const resetImage = () => {
    image.value = null
    imagePreview.value = null
    imageError.value = null // รีเซ็ตข้อผิดพลาด
}

const validateForm = (): boolean => {
    if (!title.value || !content.value || !image.value) {
        alert('Please fill in all required fields.')
        return false
    }
    return true
}

const createPost = async () => {
    if (!validateForm()) return

    isSubmitting.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('content', content.value)

    // ตรวจสอบว่า image.value ไม่เป็น null ก่อนการส่งข้อมูล
    if (image.value) {
        formData.append('image', image.value)
    }

    try {
        // ส่งคำขอ POST ไปยัง API เพื่อสร้างโพสต์
        const response = await $fetch('/api/posts', {
            method: 'POST',
            body: formData,
            onUploadProgress: (event: ProgressEvent) => {
                if (event.lengthComputable) {
                    uploadProgress.value = Math.round((event.loaded / event.total) * 100)
                }
            },
        })

        // ดึงโพสต์ใหม่ๆ หลังจากสร้างโพสต์สำเร็จ
        await fetchPosts()

        // รีเซ็ตฟอร์มหลังการสร้างโพสต์
        resetForm()

        alert('Post created successfully!')
    } catch (error) {
        console.error('Error creating post:', error)
        alert('Failed to create post.')
    } finally {
        isSubmitting.value = false
        uploadProgress.value = 0
    }
}



const resetForm = () => {
    title.value = ''
    content.value = ''
    resetImage()
}

onMounted(fetchPosts)

useHead({
    title: 'SERVICE',
    meta: [ { name: 'description', content: 'This is the service page' } ],
})
</script>

<template>
    <div class="flex flex-col items-center mt-10 w-full">
        <!-- ฟอร์ม -->
        <form @submit.prevent="createPost" class="flex flex-col gap-y-4 w-full max-w-md">
            <input v-model="title" type="text" placeholder="Title" class="input input-bordered w-full"
                :disabled="isSubmitting" />
            <textarea v-model="content" placeholder="Content" class="textarea textarea-bordered w-full"
                :disabled="isSubmitting"></textarea>

            <!-- การเลือกไฟล์ -->
            <input type="file" @change="handleFileChange" class="file-input file-input-bordered w-full"
                :disabled="isSubmitting" />

            <!-- ข้อผิดพลาดของไฟล์ -->
            <div v-if="imageError" class="text-red-500 text-sm mt-2">
                {{ imageError }}
            </div>

            <!-- การแสดงภาพ Preview -->
            <div v-if="imagePreview" class="mt-4 w-full h-64 border rounded-lg overflow-hidden">
                <img :src="imagePreview" alt="Image Preview" class="w-full h-full object-cover" />
            </div>

            <!-- แถบแสดงความคืบหน้า -->
            <div v-if="uploadProgress > 0 && isSubmitting" class="mt-2">
                <progress class="progress progress-primary w-full" :value="uploadProgress" max="100"></progress>
                <p class="text-sm text-gray-600 mt-1">Uploading: {{ uploadProgress }}%</p>
            </div>

            <!-- ปุ่มส่ง -->
            <button class="btn btn-success w-full" :disabled="isSubmitting">
                {{ isSubmitting ? 'Submitting...' : 'Create Post' }}
            </button>
        </form>

        <!-- รายการโพสต์ -->
        
    </div>
</template>

<style scoped>
/* เพิ่มการจัดสไตล์เพิ่มเติมที่นี่ */
</style>
