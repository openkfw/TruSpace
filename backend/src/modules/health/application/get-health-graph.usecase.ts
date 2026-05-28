import { healthIpfsRepository } from '../infrastructure/health-ipfs.repository';

interface GraphResponse {
  cluster_id: string;
  id_to_peername: Record<string, string>;
  ipfs_links: Record<string, string[]>;
  cluster_links: Record<string, string[]>;
  cluster_trust_links: Record<string, boolean>;
  cluster_to_ipfs: Record<string, string>;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

export async function getHealthGraph(): Promise<string> {
  const raw = await healthIpfsRepository.getNetworkGraph();
  const data: GraphResponse = typeof raw === 'string' ? JSON.parse(raw) : raw;

  const clusterIds = Object.keys(data.cluster_links);
  const ipfsIds = Object.keys(data.ipfs_links);

  // Assign stable index-based node names
  const clusterNodeName = (id: string) => `C${clusterIds.indexOf(id)}`;
  const ipfsNodeName = (id: string) => `I${ipfsIds.indexOf(id)}`;

  const lines: string[] = [];
  lines.push('digraph cluster {');
  lines.push('/* The nodes of the connectivity graph */');
  lines.push('/* The cluster-service peers */');
  lines.push('subgraph  {');
  lines.push('rank="min"');

  for (const id of clusterIds) {
    const name = data.id_to_peername[id] ?? id;
    const trusted = data.cluster_trust_links[id] ? 'orange' : 'grey';
    const node = clusterNodeName(id);
    lines.push(
      `${node} [label=< <B> ${name} </B> <BR/> <B> ${shortId(id)} </B> >` +
        ` group="${id}" color="${trusted}" style="filled" colorscheme="x11"` +
        ` fontcolor="black" fontname="Arial" shape="box3d" peripheries="2" ]`,
    );
  }

  lines.push('}');
  lines.push('');
  lines.push('/* The ipfs peers */');
  lines.push('subgraph  {');
  lines.push('rank="max"');

  for (const id of ipfsIds) {
    const node = ipfsNodeName(id);
    lines.push(
      `${node} [label=< <B> IPFS </B> <BR/> <B> ${shortId(id)} </B> >` +
        ` group="${id}" color="turquoise3" style="filled" colorscheme="x11"` +
        ` fontcolor="black" fontname="Arial" shape="cylinder" ]`,
    );
  }

  lines.push('}');
  lines.push('');
  lines.push('/* Edges representing active connections in the cluster */');
  lines.push('/* The connections among cluster-service peers */');

  for (const [id, peers] of Object.entries(data.cluster_links)) {
    for (const peerId of peers) {
      if (clusterIds.includes(peerId)) {
        lines.push(`${clusterNodeName(id)} -> ${clusterNodeName(peerId)}`);
      }
    }
  }

  lines.push('');
  lines.push('/* The connections between cluster peers and their ipfs daemons */');

  for (const [clusterId, ipfsId] of Object.entries(data.cluster_to_ipfs)) {
    if (clusterIds.includes(clusterId) && ipfsIds.includes(ipfsId)) {
      lines.push(`${clusterNodeName(clusterId)} -> ${ipfsNodeName(ipfsId)}`);
    }
  }

  lines.push('');
  lines.push('/* The swarm peer connections among ipfs daemons in the cluster */');

  for (const [id, peers] of Object.entries(data.ipfs_links)) {
    for (const peerId of peers) {
      if (ipfsIds.includes(peerId)) {
        lines.push(`${ipfsNodeName(id)} -> ${ipfsNodeName(peerId)}`);
      }
    }
  }

  lines.push('}');
  return lines.join('\n');
}
