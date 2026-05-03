<script setup lang="ts">
definePageMeta({ requiresSystem: true })
</script>

<template>
    <div />
</template>

<script lang="ts">
export default {
    mounted() {
        navigateTo("/account/settings/groups")
    }
}
</script>