# Securing the data in IPFS

TruSpace uses IPFS (InterPlanetary File System) to store documents and data. While IPFS provides a decentralized and distributed storage solution, it is important to take additional steps to secure the data stored in IPFS. Here are some best practices:

## Swarm key

To allow only authorized nodes to access the IPFS network, you can use a swarm key. The swarm key is a shared secret that is used to encrypt and decrypt the data in the IPFS network. By using a swarm key, you can ensure that only authorized nodes can access the data stored in IPFS.

## Cluster secret

In addition to the swarm key, you can also use a cluster secret to secure the IPFS cluster. The cluster secret is a shared secret that is used to authenticate and authorize nodes in the IPFS cluster. By using a cluster secret, you can ensure that only authorized nodes can join the cluster and access the data stored in it.

With both of these secrets in place, the documents are only synced to trusted IPFS nodes. All of the inter-node communication is ecrypted, the documents are encrypted with the workspace ID.

## Access control

To further secure the data in IPFS, you can implement access control mechanisms. This can include setting permissions on files and directories, restricting access to certain users or groups, and implementing authentication mechanisms to ensure that only authorized users can access the data.
