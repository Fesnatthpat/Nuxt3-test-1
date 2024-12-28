<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { type Post } from '~~/types/post';

const posts = ref<Post[]>([]);
const editForm = ref({ id: 0, title: '', content: '', imageUrl: '' });
const isModalOpen = ref(false);
const image = ref<File | null>(null);
const imagePreview = ref<string | null>(null);

const fetchPosts = async () => {
    try {
        posts.value = await $fetch<Post[]>('/api/posts');
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
};

const deletePost = async (postId: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            await $fetch(`/api/posts/${postId}`, { method: 'DELETE' });
            posts.value = posts.value.filter((post) => post.id !== postId);
            alert('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post.');
        }
    }
};

const openEditModal = (post: Post) => {
    editForm.value = {
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl || '',
    };
    imagePreview.value = post.imageUrl || '';
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    resetImage();
};

const handleImageChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[ 0 ] || null;
    if (file) {
        image.value = file;
        imagePreview.value = URL.createObjectURL(file);
    }
};

const updatePost = async () => {
    const { id, title, content } = editForm.value;
    if (!id || !title || !content) {
        alert('All fields are required for updating.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);

    if (image.value) {
        formData.append('image', image.value);
    }

    try {
        await $fetch(`/api/posts/${id}`, {
            method: 'PUT',
            body: formData,
        });
        await fetchPosts();
        closeModal();
        alert('Post updated successfully!');
    } catch (error) {
        console.error('Error updating post:', error);
        alert('Failed to update post.');
    }
};

const resetImage = () => {
    image.value = null;
    imagePreview.value = null;
};

onMounted(fetchPosts);
</script>

<template>
    <div>
        <div class="">
            <FormInput />
        </div>

        <!-- Post List -->
        <div class="mt-10 w-full max-w-3xl container mx-auto">
            <h2 class="text-xl font-bold mb-4">Posts</h2>
            <ul class="p-5">
                <li v-for="post in posts" :key="post.id" class="border-b py-2">
                    <h3 class="font-bold">{{ post.title }}</h3>
                    <p class="text-gray-700">{{ post.content }}</p>
                    <!-- Image Display -->
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

        <!-- Edit Post Modal -->
        <div v-if="isModalOpen" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-md w-96">
                <h2 class="text-lg font-bold mb-4">Edit Post</h2>
                <form @submit.prevent="updatePost">
                    <div class="mb-4">
                        <label for="title" class="block text-sm font-medium">Title</label>
                        <input v-model="editForm.title" type="text" id="title"
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                    </div>
                    <div class="mb-4">
                        <label for="content" class="block text-sm font-medium">Content</label>
                        <textarea v-model="editForm.content" id="content"
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="4"
                            required></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="image" class="block text-sm font-medium">Image</label>
                        <input type="file" id="image" @change="handleImageChange" class="mt-1 block w-full" />
                        <!-- Image Preview -->
                        <div v-if="imagePreview" class="mt-2">
                            <img :src="imagePreview" alt="Preview" class="w-full h-32 object-cover rounded-md" />
                        </div>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.btn {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-weight: 500;
}

.btn-warning {
    background-color: #fbbf24;
    color: white;
}

.btn-danger {
    background-color: #ef4444;
    color: white;
}

.btn-primary {
    background-color: #3b82f6;
    color: white;
}

.btn-secondary {
    background-color: #9ca3af;
    color: white;
}
</style>
