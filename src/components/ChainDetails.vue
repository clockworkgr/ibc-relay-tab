<template>
	<div class="w-full flex content-center justify-center my-6">
	<div class="w-1/3 pb-1/3 relative">
		<div class="absolute top-0 bottom-0 left-0 right-0 flex content-center justify-center">
			<img :src="chain?.logo_URIs?.png ?? ''" class="h-auto w-auto m-auto"/>
		</div>
	</div>
	</div>
</template>
<script setup lang="ts">
import { chains } from 'chain-registry';
defineProps<{
	chain: typeof chains[0] | undefined,
}>();
</script>