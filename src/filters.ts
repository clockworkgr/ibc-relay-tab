import type { PacketWithMetadata } from "@confio/relayer/build/lib/endpoint"

function uint8ToHex(uint8:Uint8Array):string {
  return Array.from(uint8)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('')
}
function hexToAscii(hex:string):string {
  let str = ''
  for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  return str
}
function ibcTransferAddressFilter(addressA:string, addressB:string):(packet:PacketWithMetadata['packet'])=>boolean {
	const filter = (packet: PacketWithMetadata['packet']) => {
		try {
			const data = JSON.parse(hexToAscii(uint8ToHex(packet.data)))
			if (data.sender == addressA || data.sender == addressB || data.receiver == addressA || data.receiver == addressB) {
				return true;
			} else {
				return false;
			}
		} catch {
			return false;
		}
	}
	return filter;
}
export { uint8ToHex, hexToAscii, ibcTransferAddressFilter }