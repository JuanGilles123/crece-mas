# CRECEMAS ERP - AI CONTEXT

## Project Overview
CreceMas is a modular ERP designed for retail, service, and food businesses.
The system is built as a SaaS platform with subscription-based access.

## Architecture Principles
- Modular architecture
- Clear separation between controllers, services, and data access
- Business logic must exist only in services
- Controllers handle requests and responses only
- Avoid duplicated logic across modules

## Development Rules
- Never modify unrelated modules
- Always propose changes before applying them
- Prefer extending existing services over creating new ones
- Maintain backward compatibility

## Main Modules
- Users and permissions
- Inventory
- Sales
- Purchases
- Customers
- Reports
- Subscriptions

## Coding Conventions
- Backend naming: snake_case
- English naming for variables and files
- REST API structure
- Clean and readable code preferred over short code
