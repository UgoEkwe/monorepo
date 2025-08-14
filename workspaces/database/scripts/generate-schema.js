#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate Prisma schema based on enabled features
 * This script combines core schema with optional extensions
 */

const CORE_SCHEMA = path.join(__dirname, '../prisma/schema.core.prisma');
const EXTENSIONS_SCHEMA = path.join(__dirname, '../prisma/schema.extensions.prisma');
const OUTPUT_SCHEMA = path.join(__dirname, '../prisma/schema.prisma');

function generateSchema() {
  console.log('Generating Prisma schema...');
  
  // Always include core schema
  let schemaContent = fs.readFileSync(CORE_SCHEMA, 'utf8');
  
  // Check if extensions should be included
  const enableExtensions = process.env.ENABLE_DATABASE_EXTENSIONS !== 'false';
  
  if (enableExtensions && fs.existsSync(EXTENSIONS_SCHEMA)) {
    console.log('Including database extensions...');
    
    const extensionsContent = fs.readFileSync(EXTENSIONS_SCHEMA, 'utf8');
    
    // Remove duplicate generator and datasource blocks from extensions
    const cleanExtensions = extensionsContent
      .replace(/generator\s+client\s*{[^}]*}/g, '')
      .replace(/datasource\s+db\s*{[^}]*}/g, '')
      .replace(/^\/\/.*$/gm, '') // Remove comments
      .replace(/^\s*$/gm, '') // Remove empty lines
      .trim();
    
    // Process extend model syntax
    const processedExtensions = cleanExtensions.replace(
      /extend\s+model\s+(\w+)\s*{([^}]*)}/g,
      (match, modelName, content) => {
        // Find the model in core schema and extend it
        const modelRegex = new RegExp(`(model\\s+${modelName}\\s*{[^}]*)}`, 'g');
        schemaContent = schemaContent.replace(modelRegex, (modelMatch) => {
          // Remove the closing brace and add extension content
          return modelMatch.slice(0, -1) + '\n  ' + content.trim() + '\n}';
        });
        return ''; // Remove the extend block
      }
    );
    
    // Add remaining content (new models)
    if (processedExtensions.trim()) {
      schemaContent += '\n\n' + processedExtensions;
    }
  } else {
    console.log('Database extensions disabled, using core schema only');
  }
  
  // Write the generated schema
  fs.writeFileSync(OUTPUT_SCHEMA, schemaContent);
  console.log(`Schema generated at ${OUTPUT_SCHEMA}`);
}

if (require.main === module) {
  generateSchema();
}

module.exports = { generateSchema };