<script setup lang="ts">
import { type Post } from '~~/types/post'

const posts = ref<Post[]>([])

const fetchPosts = async () => {
    try {
        posts.value = await $fetch<Post[]>('/api/posts')
    } catch (error) {
        console.error('Error fetching posts:', error)
    }
}

const deletePost = async (postId: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            await $fetch(`/api/posts/${postId}`, { method: 'DELETE' });
            // รีเฟรชข้อมูลโพสต์หลังจากลบสำเร็จ
            posts.value = posts.value.filter(post => post.id !== postId);
            alert('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post.');
        }
    }
}

onMounted(fetchPosts)

useHead({
    title: 'HOME',
    meta: [
        { name: 'description', content: 'This is the service page' },
    ],
})
</script>

<template>
    <div>
        <div class="">
            <FormInput />
        </div>

        <!-- รายการโพสต์ -->
        <div class="mt-10 w-full max-w-3xl container mx-auto">
            <h2 class="text-xl font-bold mb-4">Posts</h2>
            <ul>
                <li v-for="post in posts" :key="post.id" class="border-b py-2">
                    <h3 class="font-bold">{{ post.title }}</h3>
                    <p class="text-gray-700">{{ post.content }}</p>
                    <!-- แสดงภาพจาก URL -->
                    <div v-if="post.imageUrl" class="mt-2">
                        <img :src="post.imageUrl" alt="Post Image" class="w-full h-64 object-cover rounded-md" />
                    </div>
                    <div class="flex justify-between mt-2">
                        <button @click="openEditModal(post)" class="btn btn-warning">Edit</button>
                        <button @click="deletePost(post.id)" class="btn btn-danger">Delete</button>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped></style>
