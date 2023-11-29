
import DebugLogger from './DebugLogger.vue';
<template>
  <div class="flex w-full">
		<div class="w-full mx-6 block">
    <select v-model="chainA" @change="() => enable(chainA)" class="w-full p-3 pr-5 rounded-lg outline-none border-gray-500 bg-black border-2 text-white">
      <option v-for="chain in filteredChains" :key="chain.chain_id" :value="chain.chain_id">
        {{ chain.pretty_name }}
      </option>
    </select>
		<ChainDetails v-if="chainA" :chain="selectedChainA"/>		
		</div>
		<div class="w-full mx-6 block">
    <select v-model="chainB" @change="() => enable(chainB)" class="w-full p-3 pr-5 rounded-lg outline-none border-gray-500 bg-black border-2 text-white">
      <option v-for="chain in filteredChains" :key="chain.chain_id" :value="chain.chain_id">
        {{ chain.pretty_name }}
      </option>
    </select>
		<ChainDetails v-if="chainB" :chain="selectedChainB"/>		
		</div>
	</div>
  <template v-if="connecting">
    <div class="h-20 w-full m-auto flex justify-center content-center text-white text-2xl p-3">
        Connecting...
      </div>
  </template>
  <template v-else>
    <template v-if="chainA && chainB && !linked">
      <div class="h-20 w-full m-auto flex justify-center content-center">
        <button @click="setupRelayer" class="text-2xl font-bold text-black border-gray-300 border-2 m-auto p-3 bg-gray-300 hover:bg-white hover:border-white rounded-lg">CONNECT</button>
      </div>
    </template>
    <template v-if="chainA && chainB && linked && !running">
      <div class="h-20 w-full m-auto flex justify-center content-center">
        <button @click="runRelayer" class="text-2xl font-bold text-black border-emerald-500 border-2 m-auto p-3 bg-emerald-500 rounded-lg">RELAY</button>
      </div>
    </template>
    <template v-if="chainA && chainB && linked && running">
      <div class="h-20 w-full m-auto flex justify-center content-center">
        <button @click="stopRelayer" class="text-2xl font-bold text-black border-red-500 border-2 m-auto p-3 bg-red-500 rounded-lg">STOP</button>
      </div>
    </template>  
  </template>
		<DebugLogger :log="log"/>
</template>
<script setup lang="ts">
import { IbcClient, Link, type RelayedHeights } from '@confio/relayer'
import { GasPrice } from '@cosmjs/stargate'
import { chains, ibc } from 'chain-registry'
import { computed, ref } from 'vue'
import ChainDetails from '../components/ChainDetails.vue'
import DebugLogger from './DebugLogger.vue'
import { useLogger } from '../composables/useLogger'
import { ibcTransferAddressFilter } from '@/filters'

// Composables
const { log, logger } = useLogger();

// Vars
const chainA = ref('')
const chainB = ref('')
const running = ref(false)
const linked = ref(false)
const connecting = ref(false)
const nextRelay = ref({
  packetHeightA: 1,
  packetHeightB: 1,
  ackHeightA: 1,
  ackHeightB: 1
} as RelayedHeights)
const link = ref(null as unknown as Link)

// Helpers
const enable = (chain_id:string) => {
  window.keplr?.enable(chain_id)
}
const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Computed 
const selectedChainA = computed(() => {
  return filteredChains.value.find((x) => x.chain_id == chainA.value)
})
const selectedChainB = computed(() => {
  return filteredChains.value.find((x) => x.chain_id == chainB.value)
})
const filteredChains = computed(() => {
  return chains.filter(
    (x) => x.chain_name != '' && x.apis?.rpc?.filter((x) => x.address.includes('polkachu')).length
  )
})

// methods
const relayerLoop = async (options = { poll: 5000, maxAgeDest: 86400, maxAgeSrc: 86400 }) => {
  while (running.value) {
    try {
      nextRelay.value = await link.value.checkAndRelayPacketsAndAcks(nextRelay.value, 2, 6)
      console.group('Next Relay:')
      console.log(nextRelay.value)
      console.groupEnd()
      await link.value.updateClientIfStale('A', options.maxAgeDest)
      await link.value.updateClientIfStale('B', options.maxAgeSrc)
    } catch (e) {
      console.error(`Caught error: `, e)
    }
    await sleep(options.poll)
  }
}

const runRelayer = () => {
  running.value = true
  relayerLoop()
}

const stopRelayer = () => {
  running.value = false
}

const setupRelayer = async () => {
  connecting.value=true
  if (window.keplr && selectedChainA.value?.chain_id && selectedChainB.value?.chain_id) {
    const signerA = ref(null as unknown as ReturnType<typeof window.keplr.getOfflineSigner>)
    const signerB = ref(null as unknown as ReturnType<typeof window.keplr.getOfflineSigner>)
    signerA.value = window.keplr?.getOfflineSigner(selectedChainA.value?.chain_id)
    signerB.value = window.keplr?.getOfflineSigner(selectedChainB.value?.chain_id)

    const [accountA] = await signerA.value.getAccounts()
    const [accountB] = await signerB.value.getAccounts()
    // Create IBC Client for chain A
    const clientA = await IbcClient.connectWithSigner(
      selectedChainA.value.apis?.rpc?.find((x) => x.address.includes('polkachu')).address,
      signerA.value,
      accountA.address,
      {
        prefix: selectedChainA.value.bech32_prefix,
        logger: logger,
        gasPrice: GasPrice.fromString(
          selectedChainA.value.fees?.fee_tokens[0].low_gas_price +
            selectedChainA.value.fees?.fee_tokens[0].denom
        )
      }
    )
    console.group('IBC Client for chain A')
    console.log(clientA)
    console.groupEnd()
    // Create IBC Client for chain B
    const clientB = await IbcClient.connectWithSigner(
      selectedChainB.value.apis?.rpc?.find((x) => x.address.includes('polkachu')).address,
      signerB.value,
      accountB.address,
      {
        prefix: selectedChainB.value.bech32_prefix,
        logger: logger,
        gasPrice: GasPrice.fromString(
          selectedChainB.value.fees?.fee_tokens[0].low_gas_price +
            selectedChainB.value.fees?.fee_tokens[0].denom
        )
      }
    )
    console.group('IBC Client for chain B')
    console.log(clientB)
    console.groupEnd()
	  const headerA = await clientA.latestHeader();
		const headerB = await clientB.latestHeader();
		nextRelay.value = {
			packetHeightA: headerA.height - 100,
			packetHeightB: headerB.height - 100,
			ackHeightA: headerA.height - 100,
			ackHeightB: headerB.height - 100,
		}
    const ibcPair = ibc.find(
      (x) =>
        (x.chain_1.chain_name == selectedChainA.value?.chain_name &&
          x.chain_2.chain_name == selectedChainB.value?.chain_name) ||
        (x.chain_1.chain_name == selectedChainB.value?.chain_name &&
          x.chain_2.chain_name == selectedChainA.value?.chain_name)
    )
    if (ibcPair) {
      // Create new connectiosn for the 2 clients
      const connA =
        ibcPair.chain_1.chain_name == selectedChainA.value?.chain_name
          ? ibcPair.chain_1.connection_id
          : ibcPair.chain_2.connection_id
      const connB =
        ibcPair.chain_2.chain_name == selectedChainB.value?.chain_name
          ? ibcPair.chain_2.connection_id
          : ibcPair.chain_1.connection_id
      link.value = await Link.createWithExistingConnections(
        clientA,
        clientB,
        connA,
        connB,
        logger
      )
      link.value.setFilter(ibcTransferAddressFilter(accountA.address, accountB.address))
      console.group('IBC Link Details')
      console.log(link)
      console.groupEnd()
      linked.value = true
      connecting.value=false
    }
  }
}
</script>
