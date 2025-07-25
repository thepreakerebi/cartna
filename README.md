# Cartna

Cartna is a modern e-commerce platform that connects customers with supermarkets, enabling seamless online shopping and order management.

## Project Structure

The project is organized into two main modules:

### Customer Module
- `customer/frontend`: Next.js-based customer-facing web application
- `customer/backend`: Express.js API server for customer operations

### Supermarket Module
- `supermarket/frontend`: React-based supermarket management dashboard
- `supermarket/backend`: Express.js API server for supermarket operations

## Features

### Customer Platform
- User authentication and profile management
- Product browsing and search
- Shopping cart functionality
- Order placement and tracking

### Supermarket Platform
- Branch management
- Product catalog management
- Order processing
- Inventory management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/thepreakerebi/cartna.git
cd cartna
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Create `.env` files in each module following the provided templates
- Configure MongoDB connection strings
- Set up authentication secrets

## Development

Start the development servers:

### Customer Module
```bash
# Start customer backend
npm run dev:customer-backend

# Start customer frontend
npm run dev:customer-frontend
```

### Supermarket Module
```bash
# Start supermarket backend
npm run dev:supermarket-backend

# Start supermarket frontend
npm run dev:supermarket-frontend
```

## API Documentation

### Customer API
- Authentication endpoints
- Product endpoints
- Cart management
- Order processing

### Supermarket API
- Branch management
- Product catalog
- Order management
- Inventory control

## Database Schema

### Core Models
- Customer
- Cart
- Product
- Branch
- Order

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For support, please contact the development team.
