<template>
	<div class="relayTab">
		<select v-model="chainA">
			<option v-for="chain in filteredChains" :key="chain.chain_id" :value="chain.chain_id">{{ chain.chain_name }}</option>
		</select>
		<select v-model="chainB">
			<option v-for="chain in filteredChains" :key="chain.chain_id" :value="chain.chain_id">{{ chain.chain_name }}</option>
		</select>
		<template v-if="chainA && chainB">
		<button @click="setupRelayer">RELAY</button>
	</template>
	</div>
</template>
<script setup lang="ts">
import { Link, type RelayedHeights } from '@confio/relayer';
import { assets, chains, ibc } from 'chain-registry';
import { computed, ref } from 'vue';
const chainA = ref("");
const chainB = ref("");

const selectedChainA = computed(() => {
	return filteredChains.value.find(x => x.chain_id == chainA.value);
})

const selectedChainB = computed(() => {
	return filteredChains.value.find(x => x.chain_id == chainA.value);
})
const filteredChains = computed(() => {
	return chains.filter((x) => x.chain_name != "");
});
const running = ref(false);
const nextRelay = ref(null as unknown as RelayedHeights);
const link = ref(null as unknown as Link);

const relayerLoop = async (
	options = { poll: 5000, maxAgeDest: 86400, maxAgeSrc: 86400 }
) => {
	while (running.value) {
		try {
			nextRelay.value = await link.value.checkAndRelayPacketsAndAcks(
				nextRelay.value,
				2,
				6
			);
			console.group("Next Relay:");
			console.log(nextRelay.value);
			console.groupEnd();
			await link.value.updateClientIfStale("A", options.maxAgeDest);
			await link.value.updateClientIfStale("B", options.maxAgeSrc);
		} catch (e) {
			console.error(`Caught error: `, e);
		}
		await sleep(options.poll);
	}
};

const sleep = async (ms:number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
const runRelayer = () => {
	running.value = true;
	relayerLoop();
};

const stopRelayer = () => {
	running.value = false;
};
const signerA = ref(null as unknown as ReturnType<typeof window.keplr.getOfflineSigner>);
const signerB = ref(null as unknown as ReturnType<typeof window.keplr.getOfflineSigner>);
const setupRelayer = () => {
	signerA.value = window.keplr?.getOfflineSigner(selectedChainA.value?.chain_id);
	signerB.value = window.keplr?.getOfflineSigner(selectedChainA.value?.chain_id);
				
				const [accountA] = await signerA.value.getAccounts();
				const [accountB] = await signerB.value.getAccounts();
				// Create IBC Client for chain A
				clientA = await IbcClient.connectWithSigner(
					this.config.chainA.endpoint,
					this.signerA,
					accountA.address,
					{
						prefix: this.config.chainA.addrPrefix,
						logger: this.logger(),
						gasPrice: GasPrice.fromString(this.config.chainA.gasPrice),
					}
				);
				console.group("IBC Client for chain A");
				console.log(this.clientA);
				console.groupEnd("IBC Client for chain A");
				// Create IBC Client for chain B
				this.clientB = await IbcClient.connectWithSigner(
					this.config.chainB.endpoint,
					this.signerB,
					accountB.address,
					{
						prefix: this.config.chainB.addrPrefix,
						logger: this.logger(),
						gasPrice: GasPrice.fromString(this.config.chainB.gasPrice),
					}
				);
				console.group("IBC Client for chain B");
				console.log(this.clientB);
				console.groupEnd("IBC Client for chain B");

				// Create new connectiosn for the 2 clients
				this.link = await Link.createWithNewConnections(
					this.clientA,
					this.clientB,
					this.logger()
				);

				console.group("IBC Link Details");
				console.log(this.link);
				console.groupEnd("IBC Link Details");
				// Create a channel for the connections
				this.channels = await this.link.createChannel(
					"A",
					"transfer",
					"transfer",
					1,
					"ics20-1"
				);
				console.group("IBC Channel Details");
				console.log(this.channels);
				console.groupEnd("IBC Channel Details");
				this.next();
			},
		},
	};
</script>
<style scoped>
.relayTab {
	margin-top: 1rem;
	display:flex;
	flex-direction: column;
}
</style>