// Teste do Cache Service
import { cacheService } from './src/services/cacheService.js';

console.log('Testando Cache Service...');

// Teste 1: Adicionar dados ao cache
console.log('\n1. Adicionando dados ao cache...');
cacheService.set('test-key', { message: 'Dados de teste', timestamp: Date.now() }, 2000); // 2 segundos de TTL

console.log('Cache adicionado:', cacheService.get('test-key'));
console.log('Cache exists:', cacheService.has('test-key'));

// Teste 2: Aguardar expiração
setTimeout(() => {
    console.log('\n2. Após expiração (3 segundos):');
    console.log('Cache get (normal):', cacheService.get('test-key'));
    console.log('Cache has (normal):', cacheService.has('test-key'));
    console.log('Cache getStale:', cacheService.getStale('test-key'));
}, 3000);

// Teste 3: Verificar se dados stale ainda existem após mais tempo
setTimeout(() => {
    console.log('\n3. Após mais tempo (5 segundos):');
    console.log('Cache get (normal):', cacheService.get('test-key'));
    console.log('Cache has (normal):', cacheService.has('test-key'));
    console.log('Cache getStale:', cacheService.getStale('test-key'));
}, 5000);
