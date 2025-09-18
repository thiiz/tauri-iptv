# IPTV Desktop

Um aplicativo desktop moderno para IPTV construído com Tauri, Next.js e a biblioteca @iptv/xtream-api.

## 🚀 Funcionalidades

### Core Features
- 📺 **Canais ao Vivo** - Navegue e assista canais organizados por categorias
- 🎬 **Filmes VOD** - Biblioteca completa de filmes com detalhes e reprodução
- 📺 **Séries/Shows** - Acesso a séries com episódios organizados por temporada
- ⭐ **Favoritos** - Sistema de favoritos para canais, filmes e séries
- 📖 **Histórico** - Acompanhe o que você assistiu recentemente
- 🔍 **Busca Inteligente** - Encontre conteúdo rapidamente
- 📅 **EPG (Guia de Programação)** - Programação completa dos canais

### Desktop Features
- 🖥️ **Interface Nativa** - Design otimizado para desktop
- 🌙 **Tema Escuro/Claro** - Suporte completo a temas
- 🔧 **Configurações Avançadas** - Personalize sua experiência
- 📱 **Responsivo** - Interface adaptável a diferentes tamanhos de tela
- 🎯 **Atalhos de Teclado** - Navegação rápida por teclado
- 🔔 **Notificações** - Alertas do sistema para programas favoritos

### Tecnologias
- ⚡ **Tauri** - Framework desktop seguro e performático
- ⚛️ **Next.js 15** - Framework React moderno
- 🎨 **Shadcn/ui** - Componentes UI elegantes e acessíveis
- 🎯 **TypeScript** - Tipagem estática para melhor desenvolvimento
- 🎨 **Tailwind CSS** - Framework CSS utilitário
- 🗃️ **Zustand** - Gerenciamento de estado simples e eficiente
- 📡 **@iptv/xtream-api** - Biblioteca para integração com servidores Xtream

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Rust](https://rustup.rs/) (versão estável mais recente)
- [Bun](https://bun.sh/) (recomendado) ou npm/yarn
- Credenciais de um servidor IPTV compatível com Xtream API

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd iptv-desktop
```

### 2. Instale as dependências
```bash
bun install
```

### 3. Execute em modo de desenvolvimento
```bash
bun run tauri:dev
```

### 4. Configure suas credenciais IPTV
Na primeira execução, você será direcionado para a tela de configuração onde deve inserir:
- URL do servidor Xtream
- Nome de usuário
- Senha
- Formato preferido (m3u8, ts, mp4, etc.)

## 🏗️ Build para Produção

Para gerar o executável final:

```bash
bun run tauri:build
```

O aplicativo será gerado em `src-tauri/target/release/bundle/`

### Build de Debug (para testes)
```bash
bun run tauri:build:debug
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── app/                    # Páginas Next.js (App Router)
│   │   ├── setup/             # Tela de configuração inicial
│   │   └── dashboard/         # Dashboard principal
│   ├── components/            # Componentes React
│   │   ├── dashboard/         # Componentes do dashboard
│   │   ├── layout/           # Componentes de layout
│   │   └── ui/               # Componentes UI base
│   ├── lib/                  # Utilitários e serviços
│   │   ├── store.ts          # Store Zustand
│   │   └── iptv-service.ts   # Serviço IPTV
│   └── types/                # Definições TypeScript
│       └── iptv.ts           # Tipos IPTV
├── src-tauri/                # Código Tauri/Rust
│   ├── src/                  # Código Rust
│   ├── icons/                # Ícones da aplicação
│   ├── Cargo.toml           # Dependências Rust
│   └── tauri.conf.json      # Configuração Tauri
└── public/                   # Assets estáticos
```

## 🎮 Como Usar

### Primeira Configuração
1. Abra o aplicativo
2. Insira as credenciais do seu servidor IPTV
3. Teste a conexão
4. Clique em "Continuar" para acessar o dashboard

### Navegação
- **Dashboard**: Visão geral com estatísticas e conteúdo recente
- **Canais**: Lista de canais organizados por categoria
- **Filmes**: Biblioteca de filmes VOD
- **Séries**: Catálogo de séries e shows
- **Favoritos**: Seus itens favoritados
- **Histórico**: Conteúdo assistido recentemente
- **Configurações**: Personalize o aplicativo

### Reprodução
- Clique no botão "Play" para reproduzir conteúdo
- Use os favoritos (⭐) para salvar itens
- O histórico é atualizado automaticamente

## ⚙️ Configurações Disponíveis

### Aparência
- Tema claro/escuro/automático
- Interface responsiva

### Reprodução
- Reprodução automática
- Qualidade padrão (m3u8, ts, mp4, mkv)

### Sistema
- Sempre no topo
- Minimizar para bandeja
- Iniciar com o sistema
- Notificações

### Armazenamento
- Tamanho do cache configurável
- Limpeza de cache

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev                 # Next.js dev server
bun run tauri:dev          # Tauri development mode

# Build
bun run build              # Build Next.js
bun run tauri:build        # Build produção
bun run tauri:build:debug  # Build debug

# Qualidade de código
bun run lint               # ESLint
bun run lint:fix          # Fix ESLint issues
bun run format            # Prettier formatting
```

## 🎨 Personalização

### Adicionando Componentes UI
```bash
bunx shadcn-ui@latest add <component-name>
```

### Modificando a Interface
- Edite componentes em `src/components/`
- Customize o store em `src/lib/store.ts`
- Adicione novos tipos em `src/types/iptv.ts`

### Configuração Tauri
- Modifique `src-tauri/tauri.conf.json` para configurações da janela
- Edite `src-tauri/Cargo.toml` para dependências Rust

## 🔌 API Xtream

O aplicativo utiliza a biblioteca `@iptv/xtream-api` com serialização padronizada:

```typescript
import { Xtream } from '@iptv/xtream-api';
import { standardizedSerializer } from '@iptv/xtream-api/standardized';

const xtream = new Xtream({
  url: 'http://seu-servidor.com:8080',
  username: 'seu_usuario',
  password: 'sua_senha',
  preferredFormat: 'm3u8',
  serializer: standardizedSerializer,
});
```

### Métodos Suportados
- `getProfile()` - Informações do usuário
- `getServerInfo()` - Informações do servidor
- `getChannelCategories()` - Categorias de canais
- `getChannels()` - Lista de canais
- `getMovieCategories()` - Categorias de filmes
- `getMovies()` - Lista de filmes
- `getMovie()` - Detalhes do filme
- `getShowCategories()` - Categorias de séries
- `getShows()` - Lista de séries
- `getShow()` - Detalhes da série
- `getShortEPG()` / `getFullEPG()` - Guia de programação
- `generateStreamUrl()` - URLs de stream

## 🚀 Deploy

### Windows
O build gera automaticamente:
- `.msi` installer
- `.exe` executável

### Requisitos do Sistema
- Windows 10/11 (x64)
- Conexão com internet para streams
- Mínimo 4GB RAM recomendado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para problemas e dúvidas:
1. Verifique se suas credenciais IPTV estão corretas
2. Teste a conexão na tela de configurações
3. Consulte os logs do aplicativo
4. Abra uma issue no repositório

## 🔗 Links Úteis

- [Documentação Tauri](https://tauri.app/)
- [Documentação Next.js](https://nextjs.org/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Biblioteca @iptv/xtream-api](https://www.npmjs.com/package/@iptv/xtream-api)
- [Zustand](https://zustand-demo.pmnd.rs/)