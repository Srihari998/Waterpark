# Full-Stack Waterpark Platform

This is the next evolution of a static waterpark frontend, transformed into an intelligent, data-driven system with a Node/Express backend and a Neo4j relationship graph.

## Prerequisites
- Node.js (v16+)
- Neo4j Database (Local or AuraDB)

## Setup Instructions

1. **Install Dependencies**
   Run the following command in the root folder:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Update the `.env` file with your specific Neo4j Aura Database credentials:
   ```env
   PORT=3000
   JWT_SECRET=your_super_secret_key
   NEO4J_URI=neo4j+s://<your-db-id>.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=<your-db-password>
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

4. **Access the Application**
   - Customer Interface: `http://localhost:3000` (Make sure backend serves static, or open `public/index.html` via LiveServer depending on setup. If using Vercel dev, run `vercel dev`). For pure node, ensure you expose the public folder. Wait, I should add `app.use(express.static('public'));` to `index.js`. 

## Vercel Deployment

Deploy the project directly to Vercel:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` from the root directory.
3. Configure your Environment Variables in the Vercel dashboard.

## Features Added
- **JWT Authentication**: Register & Login. "admin" creates an admin role.
- **Neo4j Transactions**: Fully modelled Product, User, and Review nodes.
- **Relationship Graph**: Users form implicit `:CONNECTED_TO` links when interacting with the same reviews.
- **Admin Dashboard**: Visualize real-time graphs with Cytoscape.js.
