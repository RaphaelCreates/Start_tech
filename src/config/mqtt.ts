// Configurações MQTT para HiveMQ Cloud
export const mqttConfig = {
  host: '24ab66b6e7dc40adb8a552fbe0050391.s1.eu.hivemq.cloud',
  port: 8884, // Porta WebSocket
  protocol: 'wss',
  
  // ATENÇÃO: Estas credenciais precisam ser configuradas no HiveMQ Cloud Dashboard
  // Acesse: https://console.hivemq.cloud/
  // 1. Faça login na sua conta
  // 2. Vá em "Access Management" → "Users"
  // 3. Crie um usuário com estas credenciais ou use as existentes
  username: 'admin',
  password: 'Admin123',
  
  // Configurações de conexão
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30000,
  
  // QoS padrão para todas as mensagens
  defaultQoS: 1,
  
  // Configurações de WebSocket
  wsOptions: {
    rejectUnauthorized: false
  }
}
