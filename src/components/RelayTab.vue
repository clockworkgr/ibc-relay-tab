<template>
	<div class="relayTab">
		<select v-model="chainA" @change="() => enable(chainA)">
			<option v-for="chain in filteredChains" :key="chain.chain_id" :value="chain.chain_id">{{ chain.chain_name }}
			</option>
		</select>
		<select v-model="chainB"  @change="() => enable(chainB)">
			<option v-for="chain in filteredChains" :key="chain.chain_id" :value="chain.chain_id">{{ chain.chain_name }}
			</option>
		</select>
		<template v-if="chainA && chainB && !linked">
			<button @click="setupRelayer">CONNECT</button>
		</template>
		<template v-if="chainA && chainB && linked && !running">
			<button @click="runRelayer">RELAY</button>
		</template>
		<template v-if="chainA && chainB && linked && running">
			<button @click="stopRelayer">STOP</button>
		</template>
	</div>
</template>
<script setup lang="ts">
import { IbcClient, Link, type RelayedHeights } from '@confio/relayer';
import { GasPrice } from "@cosmjs/stargate";
import { chains, ibc } from 'chain-registry';
import { computed, ref } from 'vue';
const chainA = ref("");
const chainB = ref("");

const selectedChainA = computed(() => {
	return filteredChains.value.find(x => x.chain_id == chainA.value);
})
const enable = (chain_id) => {
	window.keplr?.enable(chain_id);
}
const selectedChainB = computed(() => {
	return filteredChains.value.find(x => x.chain_id == chainB.value);
})
const filteredChains = computed(() => {
	return chains.filter((x) => x.chain_name != "" && x.apis?.rpc?.filter(x=> x.address.includes('blockapsis')).length);
});
const running = ref(false);
const linked = ref(false);
const nextRelay = ref({} as unknown as RelayedHeights);
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

const sleep = async (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
const runRelayer = () => {
	running.value = true;
	relayerLoop();
};

const stopRelayer = () => {
	running.value = false;
};
const logger = () => {
	return {
		log: (msg: string) => {
			console.log("LOG: " + msg);
		},
		info: (msg: string) => {
			console.log("INFO: " + msg);
		},
		error: (msg: string) => {
			console.log("ERROR: " + msg);
		},
		warn: (msg: string) => {
			console.log("WARN: " + msg);
		},
		verbose: (msg: string) => {
			console.log("VERBOSE: " + msg);
		},
		debug: (msg: string) => {
			console.log("DEBUG: " + msg);
		},
	};
}

const setupRelayer = async () => {
	if (window.keplr && selectedChainA.value?.chain_id && selectedChainB.value?.chain_id) {
		const signerA = ref(null as unknown as ReturnType<typeof window.keplr.getOfflineSigner>);
		const signerB = ref(null as unknown as ReturnType<typeof window.keplr.getOfflineSigner>);
		signerA.value = window.keplr?.getOfflineSigner(selectedChainA.value?.chain_id);
		signerB.value = window.keplr?.getOfflineSigner(selectedChainB.value?.chain_id);

		const [accountA] = await signerA.value.getAccounts();
		const [accountB] = await signerB.value.getAccounts();
		// Create IBC Client for chain A
		const clientA = await IbcClient.connectWithSigner(
			selectedChainA.value.apis?.rpc[1].address,
			signerA.value,
			accountA.address,
			{
				prefix: selectedChainA.value.bech32_prefix,
				logger: logger(),
				gasPrice: GasPrice.fromString(selectedChainA.value.fees?.fee_tokens[0].low_gas_price+selectedChainA.value.fees?.fee_tokens[0].denom),
			}
		);
		console.group("IBC Client for chain A");
		console.log(clientA);
		console.groupEnd();
		// Create IBC Client for chain B
		const clientB = await IbcClient.connectWithSigner(
			selectedChainB.value.apis?.rpc[1].address,
			signerB.value,
			accountB.address,
			{
				prefix: selectedChainB.value.bech32_prefix,
				logger: logger(),
				gasPrice: GasPrice.fromString(selectedChainB.value.fees?.fee_tokens[0].low_gas_price+selectedChainB.value.fees?.fee_tokens[0].denom),
			}
		);
		console.group("IBC Client for chain B");
		console.log(clientB);
		console.groupEnd();

		const ibcPair = ibc.find(x => ((x.chain_1.chain_name == selectedChainA.value?.chain_name && x.chain_2.chain_name == selectedChainB.value?.chain_name) ||
			(x.chain_1.chain_name == selectedChainB.value?.chain_name && x.chain_2.chain_name == selectedChainA.value?.chain_name)));
		if (ibcPair) {
			// Create new connectiosn for the 2 clients
			const connA = ibcPair.chain_1.chain_name == selectedChainA.value?.chain_name ?
				ibcPair.chain_1.connection_id :
				ibcPair.chain_2.connection_id;
			const connB = ibcPair.chain_2.chain_name == selectedChainB.value?.chain_name ?
				ibcPair.chain_2.connection_id :
				ibcPair.chain_1.connection_id;
			link.value = await Link.createWithExistingConnections(
				clientA,
				clientB,
				connA,
				connB,
				logger()
			);

			console.group("IBC Link Details");
			console.log(link);
			console.groupEnd();
			linked.value=true;
		}
	}
};
</script>
<style scoped>
.relayTab {
	margin-top: 1rem;
	display: flex;
	flex-direction: column;
}
</style>