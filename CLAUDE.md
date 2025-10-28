# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the XJTU API library - a TypeScript library for interacting with Xi'an Jiaotong University's authentication and service systems. It provides unified identity authentication, MFA support, user information retrieval, EHall integration, and WebVPN functionality.

## Development Commands

### Core Development
- `bun run dev` - Run development server with watch mode
- `bun run build` - Build the project using TypeScript compiler
- `bun test` - Run all tests
- `bun run lint` - Run ESLint code quality checks
- `bun run lint:fix` - Auto-fix ESLint issues

### Package Management
- `bun install` - Install dependencies
- `bun run prepublishOnly` - Build before publishing (automatically runs build)

## Architecture

### Core Structure
- **`src/core/xjtu.ts`** - Main XJTU class handling authentication and session management
- **`src/services/`** - Service classes for different university systems
  - `ehall.ts` - EHall service for course, score, and classroom information
  - `webvpn.ts` - WebVPN service for VPN access
- **`src/utils/rsa.ts`** - RSA encryption utilities for secure authentication
- **`src/types/`** - Comprehensive TypeScript type definitions organized by domain

### Type System Organization
Types are organized in a hierarchical structure:
- `core/` - Core authentication and common types
- `api/` - API response types organized by domain (auth.xjtu.edu.cn, ehall.xjtu.edu.cn, webvpn.xjtu.edu.cn)
- `services/` - Service-specific types

### Authentication Flow
1. **MFA Detection** - Check if multi-factor authentication is required
2. **RSA Encryption** - Encrypt credentials using university's public key
3. **Token Acquisition** - Obtain ID and refresh tokens
4. **Service Integration** - Use tokens to access EHall, WebVPN, and other services

## Key Implementation Details

### RSA Encryption
- Uses `node-rsa` with PKCS#1 encryption scheme
- Public key stored in `ref/en/publicKey/token_1028.key`
- Encrypted strings are prefixed with `__RSA__` header

### Session Management
- Axios instances with custom user agents
- Automatic device ID and client ID generation
- Support for multiple user agents for request diversity

### Error Handling
- Comprehensive error messages in Chinese for user-facing errors
- Structured error responses with status codes
- Graceful handling of MFA requirements

## Testing and Quality

- Tests are located in `src/**/*.test.ts`
- ESLint configuration enforces TypeScript best practices
- CI pipeline runs linting, tests, and build on push/PR

## Dependencies

- **Runtime**: `axios`, `node-rsa`
- **Development**: `@types/bun`, `@types/node-rsa`, TypeScript, ESLint
- **Build Target**: ES2022, ESNext modules

## Publishing

- Package is published to npm with public access
- CI automatically publishes to npm on master branch pushes
- Version management follows semantic versioning

## Important Notes

- The library is designed for educational and authorized use cases only
- Follows the university's official authentication patterns
- Maintains compatibility with XJTU's evolving API structures
- Includes comprehensive Chinese documentation and error messages