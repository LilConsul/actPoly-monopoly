# ActPoly - Monopoly Game

## Overview
ActPoly is a web-based implementation of the classic Monopoly board game. This project features a React-based front end and a Python Flask backend, designed for multiplayer gameplay with real-time interaction.

## Project Structure
The project is organized into two main components:

### Client (Frontend)
- Built with React and JavaScript
- Manages game UI, player interactions, and game state visualization
- Key features:
  - Interactive game board
  - Real-time player updates
  - Dice rolling and movement
  - Property management
  - Game state synchronization

### Server (Backend)
- Built with Python Flask
- Handles game logic, state management, and player synchronization
- Manages database interactions for game persistence
- Provides RESTful API endpoints for the client
- Implements WebSocket for real-time updates

#### Backend Key Features
- **RESTful API Architecture**: Organized API routes for game state management
- **Custom Game Engine**: Handles game logic, rules, and flow
- **Player Management System**: User registration, authentication, and session tracking
- **Database Integration**: SQLAlchemy ORM for persistent game state storage
- **Real-time Communication**: Socket.IO implementation for instant game updates
- **JWT Authentication**: Secure user sessions and API access
- **Game State Management**: Logic for tracking properties, money, player positions, and game events
- **Modular Structure**: Clear separation of concerns with models, controllers, and service layers
- **Configuration Management**: Flexible environment-based configuration
- **Database Migrations**: Structured schema updates via migration scripts
- **Python-based Game Logic**: Core game mechanics implemented in Python

## Technologies
- **Frontend**:
  - React
  - JavaScript
  - HTML/CSS
  - Socket.IO client
  - Material UI components
  
- **Backend**:
  - Python
  - Flask
  - SQLAlchemy (Database ORM)
  - WebSockets/Socket.IO
  - JWT Authentication
  - PostgreSQL database
  - RESTful API design
  - Alembic for database migrations
  
- **Infrastructure**:
  - Docker for containerization
  - Docker Compose for orchestrating multi-container setup

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.9+
- PostgreSQL (for local database)
- Docker and Docker Compose (for containerized deployment)

### Installation and Setup

#### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/LilConsul/actPoly-monopoly.git
   cd actPoly-monopoly
   ```

2. Set up the client:
   ```bash
   cd client
   npm install
   npm start
   ```

3. Set up the server:
   ```bash
   cd server
   pip install -r requirements.txt
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env file with your database credentials
   
   # Initialize database
   flask db upgrade
   
   # Start the server
   python app.py
   ```

#### Using Docker

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

2. Access the application at http://localhost:3000

## API Documentation

The backend provides the following key API endpoints:

- `/api/users` - User management
- `/api/games` - Game creation and listing
- `/api/game/<game_id>` - Game state management
- `/api/game/<game_id>/players` - Player management within a game
- `/api/game/<game_id>/properties` - Property management
- `/api/auth` - Authentication endpoints

## Game Features
- Classic Monopoly gameplay mechanics
- Multiplayer support
- Real-time game state updates
- Property management (buying, selling, mortgaging)
- Dice rolling and movement
- Turn-based gameplay
- In-game chat and notifications
- Game state persistence
- Player banking system
- Chance and Community Chest cards
- Property auctions
- House and hotel building

## Development Status
This project is currently a Work in Progress (WIP). Core functionality is being actively developed, and new features are being added regularly.

## License
[License information not specified]

## Contributors
- [LilConsul](https://github.com/LilConsul)
- [yehorkarabanov](https://github.com/yehorkarabanov)
