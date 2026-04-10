const neo4j = require('neo4j-driver');
require('dotenv').config();

let driver;

try {
  driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );
  console.log('Neo4j Driver initialized');
} catch (error) {
  console.error('Failed to initialize Neo4j Driver', error);
}

const getSession = () => driver.session();

module.exports = {
  driver,
  getSession
};
