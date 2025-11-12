#!/bin/bash
# Script para iniciar el servidor de desarrollo ignorando errores SSL
# SOLO PARA DESARROLLO LOCAL

export NODE_TLS_REJECT_UNAUTHORIZED=0
echo "⚠️  ADVERTENCIA: Verificación SSL desactivada (solo desarrollo)"
echo "🚀 Iniciando servidor de desarrollo..."
npm start
