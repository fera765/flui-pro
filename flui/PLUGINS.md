# 🔌 Plugins do Flui - Ferramentas de Sistema

## 📋 Visão Geral

O Flui possui um sistema de plugins com ferramentas de sistema seguras que podem ser usadas pela LLM para interagir com o ambiente de desenvolvimento.

## 🛠️ Ferramentas Disponíveis

### 1. **TextReaderTool** - Leitura de Arquivos
- **Nome**: `text_reader`
- **Descrição**: Lê conteúdo de arquivos no diretório `flui/project/`
- **Parâmetros**:
  - `filePath` (string, obrigatório): Caminho do arquivo relativo ao diretório project

**Exemplo de uso:**
```typescript
const result = await toolRegistry.executeTool('text_reader', {
  filePath: 'src/index.ts'
});
```

### 2. **TextEditorTool** - Edição de Arquivos
- **Nome**: `text_editor`
- **Descrição**: Edita arquivos usando operações de replace, append ou prepend
- **Parâmetros**:
  - `filePath` (string, obrigatório): Caminho do arquivo
  - `operation` (string, obrigatório): Tipo de operação (replace, append, prepend)
  - `searchText` (string): Texto para buscar (replace)
  - `replaceText` (string): Texto para substituir (replace)
  - `newContent` (string): Novo conteúdo (append/prepend)

**Exemplo de uso:**
```typescript
// Replace
const result = await toolRegistry.executeTool('text_editor', {
  filePath: 'src/index.ts',
  operation: 'replace',
  searchText: 'old text',
  replaceText: 'new text'
});

// Append
const result = await toolRegistry.executeTool('text_editor', {
  filePath: 'src/index.ts',
  operation: 'append',
  newContent: '\n// New content added'
});
```

### 3. **ShellTool** - Execução de Comandos Seguros
- **Nome**: `shell_executor`
- **Descrição**: Executa comandos shell seguros no diretório `flui/project/`
- **Parâmetros**:
  - `command` (string, obrigatório): Comando a executar
  - `workingDirectory` (string, opcional): Diretório de trabalho

**Comandos permitidos:**
- `ls`, `dir`, `pwd`, `find`, `grep`, `cat`, `head`, `tail`, `wc`, `sort`, `uniq`
- `touch`, `mkdir`, `rmdir`, `cp`, `mv`, `rm`, `chmod`, `chown`
- `npm`, `yarn`, `pip`, `apt`, `apt-get`, `git`, `node`, `python`, `python3`
- `echo`, `printf`, `date`, `whoami`, `id`, `env`, `ps`, `top`, `htop`
- `curl`, `wget`, `tar`, `zip`, `unzip`, `gzip`, `gunzip`
- `df`, `du`, `free`, `uptime`, `uname`, `which`, `whereis`, `locate`

**Exemplo de uso:**
```typescript
const result = await toolRegistry.executeTool('shell_executor', {
  command: 'ls -la'
});
```

## 🔒 Segurança

### Restrições de Segurança:
- ❌ **Path Traversal**: Não permite `../` ou caminhos absolutos
- ❌ **Comandos Perigosos**: Bloqueia `rm -rf /`, `sudo`, `format`, etc.
- ❌ **Command Chaining**: Não permite `&&`, `||`, `;`
- ❌ **Command Substitution**: Não permite `` ` `` ou `$(`
- ❌ **Sistema**: Não permite acesso a `/etc`, `/bin`, `/sbin`, etc.

### Diretório Permitido:
- ✅ **Apenas**: `flui/project/` e subdiretórios
- ✅ **Timeout**: 30 segundos por comando
- ✅ **Buffer**: Máximo 1MB de saída

## 🧪 Testes

### Cobertura de Testes:
- ✅ **ToolRegistry**: 3 testes (registro, listagem, formato OpenAI)
- ✅ **TextReaderTool**: 3 testes (definição, validação, segurança)
- ✅ **TextEditorTool**: 3 testes (definição, validação, operações)
- ✅ **ShellTool**: 5 testes (definição, segurança, validação)
- ✅ **Integração**: 3 testes (execução através do registry)

### Executar Testes:
```bash
npm test -- --testPathPatterns=PluginTools.test.ts
```

## 🏗️ Arquitetura

### Estrutura de Arquivos:
```
src/plugins/
├── interfaces/
│   └── ITool.ts              # Interfaces para tools
├── tools/
│   ├── TextReaderTool.ts     # Ferramenta de leitura
│   ├── TextEditorTool.ts     # Ferramenta de edição
│   └── ShellTool.ts          # Ferramenta shell segura
├── services/
│   └── ToolRegistry.ts       # Registry de tools
└── __tests__/
    └── PluginTools.test.ts   # Testes dos plugins
```

### Injeção de Dependências:
```typescript
// Registrado no container
container.bind<IToolRegistry>('IToolRegistry').to(ToolRegistry).inSingletonScope();

// Injetado em qualquer service
constructor(
  @inject('IToolRegistry') private toolRegistry: IToolRegistry
) {}
```

## 💻 Como Usar

### 1. **Usar Tools Individualmente**
```typescript
import { container } from '../config/container';
import { IToolRegistry } from '../plugins/interfaces/ITool';

const toolRegistry = container.get<IToolRegistry>('IToolRegistry');

// Executar tool
const result = await toolRegistry.executeTool('text_reader', {
  filePath: 'src/index.ts'
});
```

### 2. **Usar com LLM**
```typescript
import { container } from '../config/container';
import { ILlmService } from '../interfaces/ILlmService';
import { IToolRegistry } from '../plugins/interfaces/ITool';

const llmService = container.get<ILlmService>('ILlmService');
const toolRegistry = container.get<IToolRegistry>('IToolRegistry');

// Obter tools no formato OpenAI
const tools = toolRegistry.getToolsForOpenAI();

// Usar com LLM
const response = await llmService.generateResponseWithTools(
  'List the files in the project directory',
  tools
);
```

### 3. **Listar Tools Disponíveis**
```typescript
const toolNames = toolRegistry.getRegisteredToolNames();
console.log('Available tools:', toolNames);
// Output: ['text_reader', 'text_editor', 'shell_executor']
```

## 🔮 Próximos Passos

1. **Mais Tools**: Adicionar ferramentas específicas (git, npm, etc.)
2. **Tool Chaining**: Permitir execução sequencial de tools
3. **Tool History**: Histórico de execução de tools
4. **Tool Permissions**: Sistema de permissões por tool
5. **Tool Monitoring**: Monitoramento de uso e performance

## 📊 Status Atual

- ✅ **3 Tools Implementadas**: TextReader, TextEditor, Shell
- ✅ **Registry Funcional**: Sistema de registro e execução
- ✅ **Segurança Robusta**: Validações e restrições
- ✅ **Testes Completos**: 17 testes passando
- ✅ **Integração DI**: Container configurado
- ✅ **Formato OpenAI**: Compatível com SDK

**O sistema de plugins está pronto para uso com a LLM!** 🎉