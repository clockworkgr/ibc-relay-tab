<template>
	<div class="mt-4 mx-5">
		<div class="text-white text-lg font-bold py-2 flex justify-between w-full">
			<div class="py-3">Logs</div>
			<div>
				<select v-model="level" class="p-3 pr-5 rounded-lg outline-none border-gray-500 bg-black border-2 text-white">
					<option value=1>Info</option>
					<option value=2>Error</option>
					<option value=3>Warn</option>
					<option value=4>Verbose</option>
					<option value=5>Debug</option>
				</select>
			</div>
		</div>
		<div class="bg-gray-700 rounded-lg p-3 text-white h-96 min-h-max max-h-96 overflow-auto">
			<div v-for="entry,index in toShow" :key="'log'+index">
				<span :class="'text-'+LogLevel[entry.level]">
					<span class="italic">{{formatDate(entry.timestamp)}}</span> - <span class="font-bold">{{ LogLevel[entry.level] }}:</span> {{ entry.entry }}
					<template v-if="entry.meta">
						<code class="text-xs">
							<pre>{{ entry.meta }}</pre>
						</code>
					</template>
				</span>
			</div>
		</div>
		</div>
</template>
<script setup lang="ts">
import type { Log } from "@/types"
import { LogLevel } from "@/types";
import { computed, ref } from "vue";
const props = defineProps<{ log: Log }>();
const level = ref(5 as LogLevel);
const toShow = computed(() => {
	return props.log.filter(x=> x.level<=level.value)
})
const formatDate = (date: string)=>{
	const dateParts = date.split('T');
	const timeParts = dateParts[1].split('.');
	return dateParts[0] + " " + timeParts[0];
}
</script>