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

## 📄 Licença

Este projeto está licenciado sob os termos da licença Apache 2.0.
