---
title: Security
description: TruSpace security architecture
icon: material/shield-lock
tags:
  - security
  - encryption
---

# Security

TruSpace implements multiple layers of security.

## Security Architecture

```mermaid
flowchart TB
    subgraph Transport["Transport Security"]
        TLS[TLS/HTTPS]
        IPFS_ENC[IPFS Encrypted Channels]
    end
    
    subgraph Auth["Authentication"]
        JWT[JWT Tokens]
        BCRYPT[Bcrypt Passwords]
    end
    
    subgraph Storage["Storage Security"]
        DOC_ENC[Document Encryption]
        PRIV_NET[Private IPFS Network]
    end
    
    subgraph Access["Access Control"]
        WORKSPACE[Workspace Permissions]
        MEMBER[Member Roles]
    end
```

## Authentication

### Password Storage

- Passwords hashed with **bcrypt**
- Unique salt per password
- Cost factor of 12 rounds

### Session Management

- JWT tokens for API authentication
- Configurable expiration
- Secure token storage

## Encryption

### Document Encryption

Documents are encrypted before IPFS storage:

- **Algorithm**: AES-256-CBC
- **Key derivation**: Workspace ID based
- **Decryption**: Only through TruSpace API

### Network Encryption

- All IPFS peer connections are encrypted
- Support for private IPFS networks via swarm keys

## Private Network

For sensitive deployments, use private IPFS:

```bash
# Generate swarm key
ipfs-swarm-key-gen > swarm.key

# Share with trusted peers only
```

## Access Control

### Workspace Levels

| Role | View | Edit | Delete | Admin |
|------|------|------|--------|-------|
| Viewer | ✓ | ✗ | ✗ | ✗ |
| Editor | ✓ | ✓ | ✗ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ |

## Best Practices

1. **Change default secrets** in production
2. **Use private IPFS networks** for sensitive data
3. **Enable HTTPS** via reverse proxy
4. **Regular backups** of SQLite database
5. **Keep software updated**
