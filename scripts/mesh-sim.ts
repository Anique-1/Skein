// Checks the relay logic: 6 phones in a line, each only hears its direct neighbours.
import { MeshEngine } from '../src/mesh/MeshEngine';
import { Packet, Transport } from '../src/mesh/types';

class Link implements Transport {
  label = 'sim';
  handler?: (p: Packet) => void;
  neighbours: Link[] = [];
  async start(h: (p: Packet) => void) { this.handler = h; }
  stop() {}
  broadcast(p: Packet) {
    // radio delivers a copy to every phone in range
    this.neighbours.forEach((n) => setTimeout(() => n.handler?.({ ...p }), 5));
  }
}

const N = 6;
const links = Array.from({ length: N }, () => new Link());
links.forEach((l, i) => {
  if (i > 0) l.neighbours.push(links[i - 1]);
  if (i < N - 1) l.neighbours.push(links[i + 1]);
});
const engines = links.map((l, i) => new MeshEngine(l, { id: `n${i}`, name: `node${i}` }));

(async () => {
  for (const e of engines) await e.start();
  await new Promise((r) => setTimeout(r, 400));

  engines[0].send('mesh', 'hello from node0');
  engines[0].send('dm:n5', 'private for node5');
  await new Promise((r) => setTimeout(r, 800));

  let ok = true;
  engines.slice(1).forEach((e, idx) => {
    const i = idx + 1;
    const pub = e.getState().messages.filter((m) => m.channel === 'mesh');
    const dm = e.getState().messages.filter((m) => m.channel === 'dm:n0');
    const peerHops = e.getState().peers.find((p) => p.id === 'n0')?.hops;
    console.log(`node${i}: public=${pub.length} (hops ${pub[0]?.hops}), dm=${dm.length}, sees node0 at ${peerHops} hops`);
    if (pub.length !== 1 || pub[0].hops !== i) ok = false;
    if (peerHops !== i) ok = false;
    if (i === 5 ? dm.length !== 1 : dm.length !== 0) ok = false;
  });
  console.log(ok ? 'PASS' : 'FAIL');
  engines.forEach((e) => e.stop());
  process.exit(ok ? 0 : 1);
})();
