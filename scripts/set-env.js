// scripts/set-env.js
// Este script carga las variables de entorno desde .env
// y genera los archivos environment.ts y environment.prod.ts

const fs = require('fs');
const path = require('path');

// Cargar variables desde .env
require('dotenv').config();

// Destino de los archivos de entorno
const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
const targetProdPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');

console.log('🔧 Generando archivos de entorno...');

// Crear contenido del archivo de desarrollo
const envConfigFile = `// ⚠️ ARCHIVO GENERADO AUTOMÁTICAMENTE
// No editar manualmente. Editar .env o environment.example.ts
export const environment = {
  production: false,
  supabaseUrl: '${process.env.SUPABASE_URL || ''}',
  supabaseKey: '${process.env.SUPABASE_KEY || ''}',
  geminiApiKey: '${process.env.GEMINI_API_KEY || ''}'
};
`;

// Crear contenido del archivo de producción
const envProdConfigFile = `// ⚠️ ARCHIVO GENERADO AUTOMÁTICAMENTE
// No editar manualmente. Editar .env o environment.example.ts
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL || ''}',
  supabaseKey: '${process.env.SUPABASE_KEY || ''}',
  geminiApiKey: '${process.env.GEMINI_API_KEY || ''}'
};
`;

// Escribir archivos
try {
  fs.writeFileSync(targetPath, envConfigFile);
  console.log(`✅ Generado: ${targetPath}`);
  
  fs.writeFileSync(targetProdPath, envProdConfigFile);
  console.log(`✅ Generado: ${targetProdPath}`);
  
  console.log('🎉 Entornos generados correctamente!');
} catch (error) {
  console.error('❌ Error al generar archivos de entorno:', error);
  process.exit(1);
}