# Inventory Management Service

A NestJS microservice for tracking item stock, reservations, and fulfillment for marketplace and store items.

## Features

- **Stock Level Tracking**: Real-time tracking of available, reserved, and back-order quantities
- **Reservation System**: Hold stock for purchases with configurable expiration times
- **Stock Deduction**: Automatic stock deduction on confirmed purchases
- **Back-order Handling**: Queue items when out-of-stock, fulfill when available
- **Low Stock Alerts**: Automatic detection of items below threshold
- **Inventory Analytics**: Reports on stock levels, turnover rates, and sales
- **Stock Reconciliation**: Physical count reconciliation and validation

## API Endpoints

### Inventory
- `POST /inventory` - Create inventory item
- `GET /inventory` - Get all inventory items
- `GET /inventory/:id` - Get inventory by ID
- `GET /inventory/sku/:sku` - Get inventory by SKU
- `PUT /inventory/:id` - Update inventory item
- `DELETE /inventory/:id` - Delete inventory item

### Stock
- `POST /stock/adjust` - Adjust stock level
- `POST /stock/reduce` - Reduce stock level
- `POST /stock/set` - Set stock level
- `GET /stock/inventory/:inventoryId` - Get stock by inventory
- `GET /stock/low-stock` - Get low stock items
- `GET /stock/out-of-stock` - Get out of stock items

### Reservations
- `POST /reservations` - Create stock reservation
- `POST /reservations/:id/confirm` - Confirm reservation
- `POST /reservations/:id/cancel` - Cancel reservation
- `POST /reservations/:id/fulfill` - Fulfill reservation
- `GET /reservations/order/:orderId` - Get by order
- `GET /reservations/user/:userId` - Get by user

### Back-orders
- `POST /back-orders` - Create back-order
- `POST /back-orders/process/:inventoryId` - Process pending back-orders
- `POST /back-orders/:id/cancel` - Cancel back-order

### Analytics
- `GET /analytics/stock-summary` - Stock summary
- `GET /analytics/reservations` - Reservation analytics
- `GET /analytics/top-selling` - Top selling items

### Reconciliation
- `POST /reconciliation` - Reconcile stock counts
- `GET /reconciliation/report` - Reconciliation report

## Project setup

```bash
$ npm install
```

## Compile and run

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e
```

## Docker

```bash
$ docker build -t inventory-service .
$ docker run -p 3004:3004 inventory-service
```