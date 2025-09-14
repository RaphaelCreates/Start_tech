# Portal do Colaborador - Sistema de Fretado

Este é um sistema de gerenciamento de fretado para colaboradores, recriado com React e Next.js a partir do frontend HTML/CSS/JS original.

## 🚀 Funcionalidades

### 1. **Página de Login** (`/`)
- Formulário de login com ID e senha
- Validação de campos obrigatórios
- Integração com API backend (FastAPI)
- Estados de loading e erro
- Design responsivo com efeito blur no fundo

### 2. **Dashboard Home** (`/home`)
- Saudação personalizada com nome do usuário
- Cards de acesso rápido para principais funcionalidades
- Painel de saldo de horas
- Navegação fixa no rodapé

### 3. **Página do Fretado** (`/fretado`)
- Visualização de linhas de ônibus disponíveis
- Sistema de acordeão para expandir/recolher informações das linhas
- Filtros por localização e período
- Horários disponíveis com indicação do próximo horário
- Navegação para página de fila ao clicar em um horário

### 4. **Página da Fila** (`/fila`)
- Informações da linha e horário selecionados
- Estatísticas em tempo real
- Visualização gráfica dos assentos do ônibus
- Botão para entrar/sair da fila

## 🛠️ Tecnologias Utilizadas

- **Next.js 15.5.2** - Framework React para produção
- **React 19.1.0** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática
- **CSS Modules** - Estilos isolados por componente
- **Material Symbols** - Ícones do Google
- **Boxicons** - Biblioteca de ícones adicional

## 🚀 Como executar

1. Instale as dependências: `npm install`
2. Execute o servidor: `npm run dev`
3. Acesse: http://localhost:3000

## 📋 Estrutura

- `/` - Página de login
- `/home` - Dashboard principal
- `/fretado` - Listagem de linhas e horários
- `/fila` - Visualização da fila específica

## 🎨 Design

- Mobile First
- CSS Modules
- Material Design
- Totalmente responsivo
