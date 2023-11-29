<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex flex-col justify-center content-center items-center w-full p-8">
    <header>
      <h1 class="text-white text-4xl font-bold">IBC Relay Tab</h1>
    </header>    
    <div class="container flex m-8 flex-col">
      <RouterView />
    </div>
  </div>
</template>
