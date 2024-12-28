<script setup lang="ts">

</script>

<template>
    <div class="container mx-auto max-w-full">
        <AppNavbar />
        <div class="container mx-auto min-h-screen">
            <slot />
        </div>
        <AppFooter />
    </div>
</template>

<style scoped></style>