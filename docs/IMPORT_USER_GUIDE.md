# Guia do Usuário: Importação de Transações

## Visão Geral

A funcionalidade de importação de transações permite que você importe automaticamente suas transações bancárias de arquivos de extrato, eliminando a necessidade de entrada manual de dados e reduzindo erros.

## Formatos Suportados

### 1. OFX (Open Financial Exchange)

- **Extensão**: `.ofx`
- **Descrição**: Formato padrão usado pela maioria dos bancos brasileiros
- **Vantagens**:
  - Detecção automática da conta bancária
  - Dados estruturados e confiáveis
  - Suporte a identificadores únicos de transação
- **Como obter**: Baixe o extrato OFX diretamente do site ou app do seu banco

### 2. CSV (Comma-Separated Values)

- **Extensão**: `.csv`
- **Descrição**: Formato de planilha simples e universal
- **Vantagens**:
  - Fácil de editar antes da importação
  - Suportado por todos os bancos
  - Pode ser exportado do Excel ou Google Sheets
- **Como obter**: Exporte o extrato como CSV do seu banco ou crie manualmente

### 3. PDF (Beta) 🧪

- **Extensão**: `.pdf`
- **Descrição**: Extrato em formato PDF processado com IA
- **Status**: Recurso em fase beta
- **Vantagens**:
  - Útil quando apenas PDF está disponível
  - Processamento automático com IA
- **Limitações**:
  - Pode requerer revisão manual
  - Precisão pode variar dependendo do formato do PDF
  - Recomendamos usar OFX ou CSV quando possível
- **Disponibilidade**: Verifique se o recurso está habilitado na sua instalação

## Como Importar Transações

### Passo 1: Acessar a Importação

1. Navegue até a página de **Transações**
2. Clique no botão **"Importar Transações"**
3. O modal de importação será aberto

### Passo 2: Selecionar a Conta

1. No campo **"Conta de Destino"**, selecione a conta bancária onde as transações serão importadas
2. Para arquivos OFX, o sistema tentará detectar automaticamente a conta correta
3. Você sempre poderá confirmar ou alterar a conta antes de finalizar

### Passo 3: Fazer Upload do Arquivo

1. **Opção 1 - Clique para selecionar**: Clique em "Clique para selecionar" e escolha o arquivo
2. **Opção 2 - Arrastar e soltar**: Arraste o arquivo diretamente para a área de upload
3. O arquivo será validado automaticamente:
   - Formato deve ser .ofx, .csv ou .pdf
   - Tamanho máximo: 10MB

### Passo 4: Processar o Arquivo

1. Clique em **"Processar Arquivo"**
2. Aguarde enquanto o sistema:
   - Envia o arquivo
   - Analisa o conteúdo
   - Extrai as transações
   - Detecta possíveis duplicatas

### Passo 5: Confirmar a Conta (se necessário)

1. Se o sistema detectou a conta automaticamente, você verá uma mensagem de confirmação
2. Verifique se a conta está correta
3. Clique em **"Confirmar Conta"** para prosseguir

### Passo 6: Revisar as Transações

1. Você verá uma prévia de todas as transações encontradas
2. Revise as informações:
   - **Data**: Data da transação
   - **Descrição**: Descrição/histórico da transação
   - **Valor**: Valor da transação
   - **Tipo**: Receita (verde) ou Despesa (vermelho)
   - **Categoria**: Categoria atribuída automaticamente
3. **Duplicatas**: Transações marcadas com ⚠️ podem já existir no sistema
4. **Seleção**:
   - Todas as transações são selecionadas por padrão
   - Desmarque transações que não deseja importar
   - Use "Selecionar Todas" ou "Desmarcar Todas" para facilitar

### Passo 7: Confirmar Importação

1. Revise o resumo:
   - Total de transações
   - Valor total
   - Número de duplicatas
2. Clique em **"Importar Transações"**
3. Aguarde a conclusão da importação

### Passo 8: Conclusão

1. Você verá uma mensagem de sucesso com o número de transações importadas
2. O modal fechará automaticamente após 3 segundos
3. As transações aparecerão na sua lista de transações

## Detecção de Duplicatas

O sistema detecta automaticamente possíveis duplicatas usando os seguintes critérios:

### Critérios de Detecção

1. **Identificador Externo**: Se a transação tem um ID único (FITID no OFX), verifica se já existe
2. **Correspondência Fuzzy**:
   - Data: ±2 dias da data original
   - Valor: ±R$ 0,01 do valor original
   - Descrição: Correspondência exata

### Como Lidar com Duplicatas

- Transações duplicadas são marcadas com ⚠️ na prévia
- Você pode optar por:
  - **Desmarcar**: Não importar a duplicata
  - **Importar mesmo assim**: Se tiver certeza que não é duplicata

## Atribuição Automática de Categorias

O sistema atribui categorias automaticamente baseado em palavras-chave na descrição:

| Palavra-chave          | Categoria           |
| ---------------------- | ------------------- |
| pix recebido           | Receita             |
| pix                    | Transferência       |
| boleto, conta, energia | Contas e Utilidades |
| cartão, card           | Compras             |
| uber, 99               | Transporte          |
| Outras                 | Outras              |

**Dica**: Você pode editar as categorias após a importação na lista de transações.

## Exemplos de Arquivos Válidos

### Exemplo OFX

```
OFXHEADER:100
DATA:OFXSGML
VERSION:102
...
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20251101
<TRNAMT>-50.00
<FITID>202511010001
<NAME>Supermercado XYZ
</STMTTRN>
```

### Exemplo CSV

```csv
Data,Descrição,Valor,Tipo
01/11/2025,Supermercado XYZ,-50.00,Débito
02/11/2025,Salário,5000.00,Crédito
```

**Colunas Obrigatórias**:

- Data (ou Date)
- Descrição (ou Description, Histórico)
- Valor (ou Amount, Value)

**Formatos de Data Suportados**:

- DD/MM/YYYY (ex: 01/11/2025)
- YYYY-MM-DD (ex: 2025-11-01)
- DD-MM-YYYY (ex: 01-11-2025)

**Formatos de Valor Suportados**:

- Separador decimal: vírgula (,) ou ponto (.)
- Valores negativos indicam despesas
- Valores positivos indicam receitas

## Solução de Problemas

### Erro: "Formato de arquivo não suportado"

**Causa**: O arquivo não é .ofx, .csv ou .pdf  
**Solução**:

- Verifique a extensão do arquivo
- Baixe novamente o extrato do seu banco no formato correto
- Se tiver um arquivo .txt, renomeie para .csv (se for formato CSV)

### Erro: "Arquivo muito grande"

**Causa**: O arquivo excede 10MB  
**Solução**:

- Divida o período do extrato em partes menores
- Baixe extratos mensais ao invés de anuais
- Remova páginas desnecessárias de PDFs

### Erro: "Erro ao processar o arquivo"

**Causa**: O arquivo está corrompido ou em formato incorreto  
**Solução**:

- Baixe o arquivo novamente do banco
- Verifique se o arquivo abre corretamente em um editor de texto
- Para CSV, verifique se as colunas estão separadas corretamente
- Para OFX, verifique se o arquivo não está truncado

### Erro: "Nenhuma transação encontrada"

**Causa**: O arquivo não contém transações ou está em formato não reconhecido  
**Solução**:

- Verifique se o período do extrato contém transações
- Para CSV, verifique se as colunas obrigatórias estão presentes
- Para PDF, tente converter para CSV manualmente

### Erro: "Dados inválidos encontrados"

**Causa**: Algumas transações têm dados incompletos ou inválidos  
**Solução**:

- Para CSV, verifique se todas as linhas têm valores em todas as colunas obrigatórias
- Verifique se as datas estão em formato válido
- Verifique se os valores são números válidos

### Problema: Muitas duplicatas detectadas

**Causa**: Você pode ter importado este arquivo anteriormente  
**Solução**:

- Verifique o histórico de importações
- Desmarque as duplicatas na prévia
- Use um período diferente do extrato

### Problema: Categorias incorretas

**Causa**: O sistema atribui categorias baseado em palavras-chave  
**Solução**:

- As categorias são apenas sugestões
- Você pode editar as categorias após a importação
- Acesse a transação e altere a categoria manualmente

### Problema: PDF não está sendo aceito

**Causa**: Importação de PDF pode estar desabilitada  
**Solução**:

- Verifique se você vê a mensagem "PDF (Beta)" nos formatos suportados
- Se não estiver disponível, use OFX ou CSV
- Entre em contato com o administrador para habilitar o recurso

## Dicas e Boas Práticas

### 1. Escolha o Melhor Formato

- **Primeira escolha**: OFX (mais confiável e automático)
- **Segunda escolha**: CSV (fácil de editar)
- **Última opção**: PDF (apenas se outros não estiverem disponíveis)

### 2. Importe Regularmente

- Importe extratos mensalmente para manter seus dados atualizados
- Importações menores são mais rápidas e fáceis de revisar

### 3. Revise Antes de Confirmar

- Sempre revise a prévia antes de confirmar
- Verifique se as categorias fazem sentido
- Desmarque duplicatas óbvias

### 4. Mantenha Arquivos Organizados

- Salve os arquivos de extrato com nomes descritivos
- Exemplo: `extrato_nubank_nov2025.ofx`
- Isso facilita encontrar e reimportar se necessário

### 5. Verifique o Histórico

- Use o histórico de importações para rastrear o que já foi importado
- Evite importar o mesmo período duas vezes

### 6. Edite Após Importar

- Não se preocupe em ter tudo perfeito na importação
- Você pode editar transações, categorias e descrições depois

## Segurança e Privacidade

### Proteção de Dados

- ✅ Arquivos são processados de forma segura via HTTPS
- ✅ Arquivos temporários são excluídos automaticamente após 1 hora
- ✅ Apenas você pode acessar seus arquivos e transações
- ✅ Dados sensíveis não são registrados em logs

### Importação de PDF com IA

- Apenas o texto extraído é enviado para processamento
- Informações pessoais identificáveis são protegidas
- O processamento é feito de forma segura e privada

### Limite de Taxa

- Máximo de 10 importações por hora por usuário
- Isso protege contra uso abusivo e garante performance

## Histórico de Importações

### Acessar o Histórico

1. Na página de transações, procure por "Histórico de Importações"
2. Você verá uma lista de todas as suas importações anteriores

### Informações Disponíveis

- Data e hora da importação
- Nome do arquivo importado
- Número de transações importadas
- Conta de destino
- Status (Concluída, Falhou, Parcial)

### Usar o Histórico

- Verifique se já importou um determinado arquivo
- Identifique quando transações específicas foram importadas
- Rastreie importações com falhas para tentar novamente

## Perguntas Frequentes

### Posso importar transações de múltiplas contas ao mesmo tempo?

Não, cada importação é para uma conta específica. Você precisa fazer importações separadas para cada conta.

### O que acontece se eu importar o mesmo arquivo duas vezes?

O sistema detectará as duplicatas e você poderá escolher não importá-las novamente.

### Posso editar transações antes de importar?

Não diretamente, mas você pode:

- Para CSV: editar o arquivo antes de fazer upload
- Para todas: desmarcar transações indesejadas na prévia
- Após importar: editar qualquer transação na lista

### As transações importadas afetam o saldo da conta?

Sim, as transações importadas são tratadas como transações normais e afetam o saldo da conta.

### Posso desfazer uma importação?

Não há função de desfazer automática, mas você pode:

- Excluir as transações importadas manualmente
- Usar o histórico para identificar quais transações foram importadas

### Quanto tempo leva uma importação?

- Arquivos pequenos (< 100 transações): 5-10 segundos
- Arquivos médios (100-500 transações): 10-30 segundos
- Arquivos grandes (> 500 transações): 30-60 segundos
- PDFs podem levar mais tempo devido ao processamento de IA

### Existe um limite de transações por importação?

Não há limite fixo, mas recomendamos:

- Máximo de 1000 transações por importação
- Para períodos maiores, divida em múltiplas importações

## Suporte

Se você encontrar problemas não cobertos neste guia:

1. Verifique a seção de Solução de Problemas acima
2. Consulte o histórico de importações para detalhes de erros
3. Entre em contato com o suporte técnico com:
   - Descrição do problema
   - Tipo de arquivo (OFX, CSV, PDF)
   - Mensagem de erro (se houver)
   - Captura de tela (se possível)

## Atualizações e Melhorias

Este recurso está em constante evolução. Melhorias futuras planejadas:

- 🔄 Importação automática agendada
- 🤖 Aprendizado de máquina para categorização
- 📊 Detecção inteligente de duplicatas
- 🏦 Detecção automática de banco
- 📝 Templates de mapeamento CSV personalizados

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0
