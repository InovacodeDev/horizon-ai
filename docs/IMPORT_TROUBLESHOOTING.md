# Guia de Solução de Problemas: Importação de Transações

## Índice

- [Erros de Arquivo](#erros-de-arquivo)
- [Erros de Processamento](#erros-de-processamento)
- [Problemas com Duplicatas](#problemas-com-duplicatas)
- [Problemas com Categorias](#problemas-com-categorias)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas Específicos por Formato](#problemas-específicos-por-formato)

---

## Erros de Arquivo

### ❌ "Formato de arquivo não suportado"

**Sintoma**: Mensagem de erro ao tentar fazer upload do arquivo

**Causas Possíveis**:

- Extensão do arquivo incorreta
- Arquivo renomeado manualmente com extensão errada
- Formato não suportado pelo sistema

**Soluções**:

1. **Verificar a extensão do arquivo**

   ```
   Extensões válidas: .ofx, .csv, .pdf
   ```

2. **Baixar novamente do banco**
   - Acesse o site/app do seu banco
   - Procure por "Exportar extrato" ou "Download"
   - Selecione o formato correto (OFX ou CSV recomendado)

3. **Converter o formato**
   - Se você tem um arquivo .txt com dados CSV:
     - Abra no Excel ou Google Sheets
     - Salve como .csv
   - Se você tem um PDF e quer CSV:
     - Use ferramentas online de conversão (com cuidado!)
     - Ou copie e cole os dados em uma planilha

**Exemplo de Erro**:

```
❌ Formato de arquivo não suportado. Use .ofx, .csv ou .pdf
```

---

### ❌ "Arquivo muito grande"

**Sintoma**: Upload rejeitado com mensagem de tamanho

**Causa**: Arquivo excede o limite de 10MB

**Soluções**:

1. **Dividir o período**
   - Em vez de importar 1 ano inteiro, importe mês a mês
   - Exemplo:
     - ❌ Janeiro a Dezembro 2025
     - ✅ Janeiro 2025, depois Fevereiro 2025, etc.

2. **Para arquivos CSV**
   - Abra o arquivo no Excel/Google Sheets
   - Divida em múltiplos arquivos menores
   - Mantenha o cabeçalho em cada arquivo

3. **Para arquivos PDF**
   - Use ferramentas para dividir o PDF
   - Ou extraia apenas as páginas necessárias
   - Considere converter para CSV se possível

**Dica**: Importações menores são mais rápidas e fáceis de revisar!

---

## Erros de Processamento

### ❌ "Erro ao processar o arquivo"

**Sintoma**: Erro após upload, durante o processamento

**Causas Possíveis**:

- Arquivo corrompido
- Formato interno incorreto
- Codificação de caracteres incompatível
- Arquivo truncado ou incompleto

**Soluções**:

1. **Baixar novamente**
   - O arquivo pode ter sido corrompido durante o download
   - Tente baixar novamente do banco

2. **Verificar integridade do arquivo**

   **Para OFX**:
   - Abra em um editor de texto
   - Verifique se começa com `OFXHEADER:` ou `<?xml`
   - Verifique se termina com `</OFX>` (para XML)

   **Para CSV**:
   - Abra no Excel ou editor de texto
   - Verifique se todas as linhas têm o mesmo número de colunas
   - Verifique se não há caracteres estranhos

   **Para PDF**:
   - Tente abrir no Adobe Reader ou navegador
   - Verifique se o conteúdo é legível

3. **Verificar codificação**
   - Arquivos devem estar em UTF-8 ou ISO-8859-1
   - Se tiver caracteres especiais estranhos, reconverta a codificação

4. **Simplificar o arquivo (CSV)**
   - Remova colunas desnecessárias
   - Mantenha apenas: Data, Descrição, Valor
   - Remova formatação especial

**Exemplo de Arquivo OFX Válido**:

```xml
OFXHEADER:100
DATA:OFXSGML
VERSION:102
...
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20251101</DTPOSTED>
            <TRNAMT>-50.00</TRNAMT>
            <NAME>Supermercado</NAME>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
```

**Exemplo de Arquivo CSV Válido**:

```csv
Data,Descrição,Valor
01/11/2025,Supermercado XYZ,-50.00
02/11/2025,Salário,5000.00
03/11/2025,Conta de luz,-150.00
```

---

### ❌ "Nenhuma transação encontrada"

**Sintoma**: Processamento completa mas nenhuma transação é exibida

**Causas Possíveis**:

- Arquivo vazio ou sem transações no período
- Formato de dados não reconhecido
- Colunas obrigatórias ausentes (CSV)
- Seção de transações vazia (OFX)

**Soluções**:

1. **Verificar conteúdo do arquivo**
   - Abra o arquivo e confirme que há transações
   - Verifique se o período selecionado no banco contém movimentações

2. **Para CSV - Verificar colunas obrigatórias**

   **Colunas necessárias** (nomes aceitos):
   - **Data**: Data, Date, Data da Transação
   - **Descrição**: Descrição, Description, Histórico, Memo
   - **Valor**: Valor, Amount, Value, Montante

   **Exemplo correto**:

   ```csv
   Data,Descrição,Valor
   01/11/2025,Compra,100.00
   ```

   **Exemplo incorreto** (falta coluna Valor):

   ```csv
   Data,Descrição
   01/11/2025,Compra
   ```

3. **Para OFX - Verificar estrutura**
   - Procure pela tag `<BANKTRANLIST>`
   - Deve conter pelo menos uma tag `<STMTTRN>`

4. **Para PDF - Limitações**
   - PDFs muito complexos podem não ser processados corretamente
   - Tente converter para CSV manualmente
   - Ou use OFX se disponível

---

### ❌ "Dados inválidos encontrados no arquivo"

**Sintoma**: Erro indicando problemas com os dados

**Causas Possíveis**:

- Datas em formato não reconhecido
- Valores não numéricos
- Campos obrigatórios vazios
- Caracteres especiais problemáticos

**Soluções**:

1. **Verificar formato de datas**

   **Formatos aceitos**:
   - ✅ DD/MM/YYYY (01/11/2025)
   - ✅ YYYY-MM-DD (2025-11-01)
   - ✅ DD-MM-YYYY (01-11-2025)
   - ✅ YYYYMMDD (20251101) - apenas OFX

   **Formatos NÃO aceitos**:
   - ❌ MM/DD/YYYY (formato americano)
   - ❌ DD/MM/YY (ano com 2 dígitos)
   - ❌ Texto como "1 de novembro"

2. **Verificar formato de valores**

   **Formatos aceitos**:
   - ✅ 100.00 (ponto como decimal)
   - ✅ 100,00 (vírgula como decimal)
   - ✅ -100.00 (negativo para despesas)
   - ✅ 1.000,00 (com separador de milhares)

   **Formatos NÃO aceitos**:
   - ❌ R$ 100,00 (com símbolo de moeda)
   - ❌ 100 reais (texto)
   - ❌ Vazio ou "-"

3. **Limpar dados no CSV**

   ```csv
   # Antes (incorreto)
   Data,Descrição,Valor
   1/11/25,Compra,R$ 100,00

   # Depois (correto)
   Data,Descrição,Valor
   01/11/2025,Compra,100.00
   ```

4. **Remover linhas problemáticas**
   - Identifique linhas com dados incompletos
   - Remova ou corrija antes de importar
   - Você pode adicionar essas transações manualmente depois

---

## Problemas com Duplicatas

### ⚠️ Muitas duplicatas detectadas

**Sintoma**: Grande número de transações marcadas como possíveis duplicatas

**Causas Possíveis**:

- Arquivo já foi importado anteriormente
- Período do extrato se sobrepõe com importação anterior
- Transações recorrentes similares

**Soluções**:

1. **Verificar histórico de importações**
   - Acesse "Histórico de Importações"
   - Verifique se este arquivo ou período já foi importado
   - Veja a data da última importação

2. **Ajustar período do extrato**
   - Baixe extrato apenas do período não importado
   - Exemplo: Se já importou até 31/10, baixe de 01/11 em diante

3. **Revisar duplicatas na prévia**
   - Transações marcadas com ⚠️ são possíveis duplicatas
   - Desmarque as que você tem certeza que são duplicatas
   - Mantenha marcadas se não tiver certeza (você pode excluir depois)

4. **Entender os critérios de detecção**
   - O sistema considera duplicata se:
     - Mesmo ID externo (FITID)
     - OU: Data ±2 dias + Valor ±R$0,01 + Descrição igual

**Exemplo de Duplicata Legítima**:

```
Transação existente: 01/11/2025 | Netflix | -49.90
Nova transação:      01/11/2025 | Netflix | -49.90
→ Provavelmente duplicata ✓
```

**Exemplo de NÃO Duplicata**:

```
Transação existente: 01/11/2025 | Netflix | -49.90
Nova transação:      01/12/2025 | Netflix | -49.90
→ Assinaturas mensais diferentes ✗
```

---

### ⚠️ Duplicatas não detectadas

**Sintoma**: Transações duplicadas não são marcadas como tal

**Causas Possíveis**:

- Descrições ligeiramente diferentes
- Datas fora da janela de ±2 dias
- Valores com diferença maior que R$0,01

**Soluções**:

1. **Revisar manualmente na prévia**
   - Ordene por data ou valor
   - Procure por transações similares
   - Desmarque duplicatas óbvias

2. **Após importar**
   - Use a busca na lista de transações
   - Filtre por período e valor
   - Exclua duplicatas manualmente

3. **Prevenir em futuras importações**
   - Mantenha registro de períodos importados
   - Use sempre o mesmo formato de arquivo
   - Importe regularmente para evitar sobreposição

---

## Problemas com Categorias

### 🏷️ Categorias incorretas ou genéricas

**Sintoma**: Transações categorizadas como "Outras" ou categoria errada

**Causa**: Sistema de categorização automática é baseado em palavras-chave simples

**Soluções**:

1. **Entender a categorização automática**

   Palavras-chave reconhecidas:
   - "pix recebido" → Receita
   - "pix" → Transferência
   - "boleto", "conta" → Contas e Utilidades
   - "cartão", "card" → Compras
   - "uber", "99" → Transporte
   - Outras → Outras

2. **Editar após importação**
   - As categorias são apenas sugestões
   - Você pode editar cada transação individualmente
   - Ou usar edição em lote (se disponível)

3. **Melhorar descrições no CSV**
   - Antes de importar, edite o CSV
   - Adicione palavras-chave relevantes às descrições
   - Exemplo: "Compra Supermercado" → "Supermercado - Alimentação"

4. **Aceitar e corrigir depois**
   - Não se preocupe em ter tudo perfeito na importação
   - Foque em importar os dados
   - Organize as categorias posteriormente

---

## Problemas de Performance

### 🐌 Importação muito lenta

**Sintoma**: Processamento demora muito tempo

**Causas Possíveis**:

- Arquivo muito grande
- Muitas transações
- PDF complexo
- Conexão lenta

**Soluções**:

1. **Dividir em arquivos menores**
   - Importe períodos menores (mensal em vez de anual)
   - Limite: ~500 transações por importação

2. **Usar formato mais eficiente**
   - OFX é mais rápido que PDF
   - CSV é mais rápido que PDF
   - Evite PDF quando possível

3. **Verificar conexão**
   - Teste sua velocidade de internet
   - Tente em horário de menor tráfego
   - Use conexão cabeada se possível

4. **Tempos esperados**:
   - < 100 transações: 5-10 segundos
   - 100-500 transações: 10-30 segundos
   - > 500 transações: 30-60 segundos
   - PDF: adicione 10-30 segundos extras

---

### 🔄 "Erro ao salvar as transações"

**Sintoma**: Processamento completa mas falha ao salvar

**Causas Possíveis**:

- Problema de conexão com banco de dados
- Timeout por arquivo muito grande
- Limite de taxa excedido

**Soluções**:

1. **Tentar novamente**
   - Aguarde alguns minutos
   - Tente importar novamente

2. **Reduzir tamanho**
   - Divida o arquivo em partes menores
   - Importe em lotes

3. **Verificar limite de taxa**
   - Máximo: 10 importações por hora
   - Se excedeu, aguarde e tente depois

4. **Verificar status do sistema**
   - Pode haver manutenção em andamento
   - Entre em contato com suporte se persistir

---

## Problemas Específicos por Formato

### OFX

#### Problema: "Conta não detectada automaticamente"

**Solução**:

- Verifique se o arquivo OFX contém as tags:
  - `<BANKID>` (código do banco)
  - `<BRANCHID>` (agência)
  - `<ACCTID>` (número da conta)
- Se ausentes, selecione a conta manualmente
- Alguns bancos não incluem essas informações

#### Problema: "Versão OFX não suportada"

**Solução**:

- Sistema suporta OFX 1.0 (SGML) e 2.0 (XML)
- Se tiver problemas, tente exportar em formato diferente
- Ou converta para CSV

---

### CSV

#### Problema: "Colunas não reconhecidas"

**Solução**:

1. Renomeie as colunas para nomes padrão:

   ```csv
   Data,Descrição,Valor
   ```

2. Nomes alternativos aceitos:
   - Data: Date, Data da Transação
   - Descrição: Description, Histórico, Memo
   - Valor: Amount, Value, Montante

3. Remova colunas extras desnecessárias

#### Problema: "Delimitador não reconhecido"

**Solução**:

- Sistema detecta automaticamente: vírgula, ponto-e-vírgula, tab
- Se usar outro delimitador, converta para vírgula
- No Excel: Salvar Como → CSV (separado por vírgulas)

---

### PDF

#### Problema: "Importação de PDF não disponível"

**Solução**:

- Recurso pode estar desabilitado
- Verifique se vê "PDF (Beta)" nos formatos suportados
- Use OFX ou CSV como alternativa
- Entre em contato com administrador

#### Problema: "Transações extraídas incorretamente"

**Solução**:

- PDF é processado com IA e pode ter erros
- Revise cuidadosamente a prévia
- Corrija valores/datas manualmente após importar
- Para maior precisão, use OFX ou CSV

#### Problema: "Erro ao processar PDF"

**Solução**:

- PDF pode estar protegido ou criptografado
- Tente remover proteção antes de importar
- Ou converta para CSV manualmente
- PDFs escaneados (imagem) não são suportados

---

## Checklist de Diagnóstico

Use este checklist para diagnosticar problemas:

### Antes de Importar

- [ ] Arquivo tem extensão correta (.ofx, .csv, .pdf)?
- [ ] Arquivo tem menos de 10MB?
- [ ] Arquivo abre corretamente em editor/visualizador?
- [ ] Período do extrato contém transações?
- [ ] Já verifiquei o histórico de importações?

### Para CSV

- [ ] Arquivo tem colunas: Data, Descrição, Valor?
- [ ] Datas estão em formato DD/MM/YYYY ou similar?
- [ ] Valores são números (sem R$, sem texto)?
- [ ] Todas as linhas têm o mesmo número de colunas?

### Para OFX

- [ ] Arquivo começa com OFXHEADER ou <?xml?
- [ ] Arquivo contém tag <BANKTRANLIST>?
- [ ] Arquivo não está truncado?

### Para PDF

- [ ] PDF abre corretamente no visualizador?
- [ ] PDF contém texto (não é imagem escaneada)?
- [ ] Recurso PDF está habilitado no sistema?

### Durante Importação

- [ ] Selecionei a conta correta?
- [ ] Revisei a prévia antes de confirmar?
- [ ] Verifiquei duplicatas marcadas?
- [ ] Categorias fazem sentido?

---

## Quando Entrar em Contato com Suporte

Entre em contato se:

1. ✅ Você seguiu todos os passos deste guia
2. ✅ Problema persiste após múltiplas tentativas
3. ✅ Erro não está documentado aqui
4. ✅ Você tem mensagem de erro específica

**Informações para incluir**:

- Descrição detalhada do problema
- Tipo de arquivo (OFX, CSV, PDF)
- Mensagem de erro exata
- Captura de tela (se possível)
- Passos para reproduzir o problema
- Tamanho do arquivo e número aproximado de transações

---

## Recursos Adicionais

- 📖 [Guia do Usuário Completo](./IMPORT_USER_GUIDE.md)
- 👨‍💻 [Documentação para Desenvolvedores](./IMPORT_DEVELOPER_GUIDE.md)
- 🏦 Consulte o site do seu banco para instruções de exportação
- 💬 Comunidade de usuários (se disponível)

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0
