<script setup>
import { useAuthStore } from "@/stores/useAuthStore";
import AuthenticatedLayout from "@/views/layouts/AuthenticatedLayout.vue";
import AnonymousLayout from "@/views/layouts/AnonymousLayout.vue";

const authStore = useAuthStore();
</script>

<template>
  <AuthenticatedLayout v-if="authStore.isAuthenticated" />
  <AnonymousLayout v-else />
</template>
