# Siluar - Gestão Financeira Familiar

O **Siluar** é uma aplicação completa e intuitiva de gestão de finanças pessoais e familiares, desenvolvida para proporcionar controle total sobre receitas, despesas, contas bancárias, orçamentos por categoria e cartões de crédito com suas respectivas faturas.

---

## 🚀 Funcionalidades Principais

### 1. 📊 Painel Geral (Dashboard)
- **Visão Consolidada**: Visualização do saldo total acumulado, receitas do mês, despesas do mês e total em faturas abertas.
- **Gráficos Interativos**: Gráfico de despesas por categoria e evolução do fluxo financeiro.
- **Resumo por Membro**: Acompanhamento dos lançamentos individuais por integrante da família.

### 2. 💸 Gestão de Transações
- **Lançamentos Detalhados**: Cadastro de receitas, despesas e transferências entre contas bancárias.
- **Filtros e Busca**: Filtragem dinâmica por mês/ano, tipo de transação, membro da família, categoria e palavra-chave.
- **Suporte a Parcelamento**: Suporte a compras parceladas no cartão de crédito com distribuição automática do valor pelas faturas subsequentes.

### 3. 💳 Cartões de Crédito e Faturas
- **Controle de Limites**: Acompanhamento do limite total e limite disponível em tempo real.
- **Faturas Mensais**: Navegação entre meses passados e futuros com detalhamento de todos os itens da fatura.
- **Pagamento de Faturas**: Fluxo para dar baixa no pagamento da fatura debitando diretamente do saldo de uma conta bancária selecionada.
- **Gerenciamento Completo**: Adição, edição e remoção de cartões de crédito.

### 4. 👥 Membros da Família e Contas Bancárias
- **Organização Familiar**: Vinculação de transações aos membros cadastrados da família.
- **Multi-Contas**: Gestão de diferentes contas bancárias e carteiras com saldo atualizado em tempo real.
- **Transferências**: Transferência direta de saldo entre contas, com validação de saldo disponível.

### 5. 🎯 Categorias e Orçamentos
- **Categorização Personalizada**: Criação e organização de categorias para receitas e despesas.
- **Definição de Teto/Orçamento**: Acompanhamento do limite de gastos por categoria com alertas visuais e barras de progresso.

### 6. 🔒 Privacidade e Armazenamento 100% Local
- **Dados no Seu Navegador**: Todo o banco de dados e histórico de transações são mantidos de forma persistente e segura no armazenamento local (`localStorage`) da sua própria máquina.
- **Backup e Restauração**:
  - **Exportar**: Baixe uma cópia de segurança de todos os seus dados em formato JSON a qualquer momento.
  - **Importar**: Restaure ou transfira seus dados facilmente selecionando o arquivo de backup `.json`.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19 & TypeScript
- **Bundler & Dev Server**: Vite 6
- **Estilização**: Tailwind CSS 4
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Geração de PDF**: jsPDF

---

## ⚙️ Como Executar o Projeto

**Pré-requisitos**: Node.js 18 ou superior.

1. **Instalar as dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   A aplicação ficará disponível em `http://localhost:3000`.

3. **Gerar versão de produção**:
   ```bash
   npm run build
   ```

4. **Pré-visualizar a build de produção**:
   ```bash
   npm run preview
   ```

---

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes de UI (Dashboard, Transações, Cartões, etc.)
├── data/           # Dados iniciais/demonstrativos
├── utils/          # Funções utilitárias (cálculos financeiros, datas, PDF)
├── types.ts        # Definições de tipos TypeScript
└── main.tsx        # Ponto de entrada da aplicação
```

---

## 🖥️ Colocando em Produção Local (Windows)

Como todos os dados ficam salvos no `localStorage` do navegador, o Siluar **não precisa de nenhum servidor na nuvem**. Ele pode rodar permanentemente na sua própria máquina.

### 1. Gerar a build de produção

```powershell
npm run build
```

Isso cria a pasta `dist/` com os arquivos otimizados (versão real de produção, diferente do modo de desenvolvimento).

### 2. Iniciar automaticamente

Dê duplo clique em **`iniciar-siluar.bat`** (na raiz do projeto). Ele:
- Gera a build (`npm run build`) automaticamente, caso a pasta `dist/` ainda não exista.
- Instala o pacote `serve` (servidor estático leve), se necessário.
- Sobe o app em **http://localhost:3000**.

### 3. Deixar rodando sempre que o Windows iniciar (opcional)

1. Pressione `Win + R`, digite `shell:startup` e tecle Enter.
2. Crie um **atalho** do arquivo `iniciar-siluar.bat` dentro dessa pasta.

A partir daí, o Siluar sobe sozinho em segundo plano toda vez que o Windows é ligado — basta abrir `http://localhost:3000` no navegador.

### 4. Acesso como app (opcional)

No Chrome ou Edge, acesse `http://localhost:3000`, abra o menu (⋮) e escolha **"Instalar app"** (ou "Criar atalho"). Isso cria um ícone que abre o Siluar como se fosse um programa nativo, sem barra de endereço.



Este projeto está licenciado sob os termos da licença Apache 2.0.
