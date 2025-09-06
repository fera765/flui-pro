# Flui Agent

Agente autônomo desenvolvido com API REST utilizando 100% TDD e Injeção de Dependências.

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Express.js** para API REST
- **Inversify** para Injeção de Dependências
- **Jest** para Testes (TDD)
- **ESLint** para Linting

## 📁 Estrutura do Projeto

```
src/
├── controllers/     # Controllers da API
├── services/        # Lógica de negócio
├── repositories/    # Acesso a dados
├── models/          # Modelos de dados
├── interfaces/      # Contratos/Interfaces
├── utils/           # Utilitários
├── config/          # Configurações
└── test/            # Setup de testes
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm start` - Executa a versão compilada
- `npm test` - Executa os testes
- `npm run test:watch` - Executa testes em modo watch
- `npm run test:coverage` - Executa testes com cobertura
- `npm run lint` - Executa o linter
- `npm run lint:fix` - Corrige problemas do linter

## 🧪 TDD

Este projeto segue 100% TDD (Test-Driven Development):
1. **Red** - Escrever teste que falha
2. **Green** - Implementar código mínimo para passar
3. **Refactor** - Refatorar mantendo os testes passando

## 🔧 Injeção de Dependências

Utilizamos Inversify para gerenciar dependências:
- Container centralizado em `src/config/container.ts`
- Decorators para registrar serviços
- Interfaces para contratos

## 🚀 Como Executar

1. Instalar dependências:
```bash
npm install
```

2. Executar em desenvolvimento:
```bash
npm run dev
```

3. Executar testes:
```bash
npm test
```

## 📊 Health Check

A API possui um endpoint de health check:
- **GET** `/health` - Status da aplicação