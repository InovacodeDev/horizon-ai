# Requirements Document

## Introduction

O Cérebro Financeiro representa a evolução da Horizon AI de uma plataforma de inteligência financeira para um sistema operacional indispensável para gestão patrimonial. Esta feature resolve a dor mais aguda da classe média e alta brasileira: a complexidade da declaração do Imposto de Renda (IRPF), especialmente relacionada a investimentos. Ao conectar corretoras e automatizar cálculos fiscais, a plataforma economiza dezenas de horas dos usuários, protege contra erros caros e solidifica um fosso competitivo através do Data Network Effect.

## Requirements

### Requirement 1: Consolidação de Portfólio Multi-Corretora

**User Story:** Como investidor, eu quero conectar minhas múltiplas corretoras em um único lugar, para que eu possa visualizar todo meu patrimônio consolidado sem precisar acessar diferentes plataformas.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de conexões THEN o sistema SHALL exibir uma lista de corretoras disponíveis para conexão
2. WHEN o usuário seleciona uma corretora para conectar THEN o sistema SHALL iniciar um fluxo de autenticação seguro com a corretora
3. WHEN a conexão é estabelecida com sucesso THEN o sistema SHALL armazenar as credenciais de forma criptografada
4. WHEN o usuário possui múltiplas conexões ativas THEN o sistema SHALL exibir o status de sincronização de cada uma
5. WHEN o usuário solicita remover uma conexão THEN o sistema SHALL deletar todos os dados associados de forma segura
6. IF a conexão com uma corretora falhar THEN o sistema SHALL notificar o usuário com instruções claras de resolução

### Requirement 2: Sincronização Automática de Dados de Investimento

**User Story:** Como usuário conectado, eu quero que meus dados de investimento sejam sincronizados automaticamente, para que eu sempre tenha informações atualizadas sem esforço manual.

#### Acceptance Criteria

1. WHEN uma nova conexão é estabelecida THEN o sistema SHALL iniciar uma sincronização completa do histórico de transações
2. WHEN o job de sincronização periódica executa THEN o sistema SHALL buscar novas transações de todas as conexões ativas
3. WHEN novas transações são recebidas THEN o sistema SHALL armazená-las sem criar duplicatas
4. IF uma sincronização falhar THEN o sistema SHALL registrar o erro e tentar novamente no próximo ciclo sem afetar outras conexões
5. WHEN a sincronização é concluída THEN o sistema SHALL atualizar o timestamp de última sincronização
6. WHEN o usuário acessa o dashboard THEN o sistema SHALL exibir a data da última sincronização de cada corretora

### Requirement 3: Dashboard de Portfólio Consolidado

**User Story:** Como investidor, eu quero visualizar meu patrimônio total e alocação de ativos em um dashboard intuitivo, para que eu possa tomar decisões informadas sobre meus investimentos.

#### Acceptance Criteria

1. WHEN o usuário acessa o dashboard de portfólio THEN o sistema SHALL exibir o valor total consolidado de todos os investimentos
2. WHEN o dashboard é carregado THEN o sistema SHALL apresentar um gráfico de alocação por tipo de ativo (ações, FIIs, renda fixa, etc.)
3. WHEN o usuário visualiza suas posições THEN o sistema SHALL exibir uma lista detalhada com ticker, quantidade, preço médio e valor atual
4. WHEN o usuário possui investimentos em múltiplas corretoras THEN o sistema SHALL consolidar posições do mesmo ativo
5. WHEN os dados de mercado são atualizados THEN o sistema SHALL recalcular automaticamente os valores de mercado das posições
6. IF o usuário não possui conexões ativas THEN o sistema SHALL exibir um CTA claro para conectar a primeira corretora

### Requirement 4: Cálculo de Preço Médio de Aquisição

**User Story:** Como investidor, eu quero que o sistema calcule automaticamente o preço médio de aquisição dos meus ativos, para que eu possa entender meu custo real e calcular ganhos/perdas corretamente.

#### Acceptance Criteria

1. WHEN o usuário compra um ativo THEN o sistema SHALL recalcular o preço médio considerando todas as compras anteriores
2. WHEN o usuário vende parcialmente um ativo THEN o sistema SHALL manter o preço médio das cotas remanescentes
3. WHEN o usuário vende totalmente um ativo e depois recompra THEN o sistema SHALL iniciar um novo cálculo de preço médio
4. WHEN o sistema calcula o preço médio THEN ele SHALL considerar custos de corretagem e emolumentos
5. WHEN o usuário visualiza uma posição THEN o sistema SHALL exibir claramente o preço médio de aquisição
6. IF houver bonificações ou desdobramentos THEN o sistema SHALL ajustar o preço médio proporcionalmente

### Requirement 5: Apuração de Ganho de Capital

**User Story:** Como investidor, eu quero que o sistema calcule automaticamente meus ganhos de capital em vendas de ativos, para que eu saiba exatamente quanto imposto devo pagar mensalmente.

#### Acceptance Criteria

1. WHEN o usuário vende um ativo THEN o sistema SHALL calcular o ganho/prejuízo usando o preço médio de aquisição
2. WHEN o total de vendas de ações no mês é inferior a R$ 20.000 THEN o sistema SHALL aplicar a isenção de imposto
3. WHEN o total de vendas de ações no mês ultrapassa R$ 20.000 THEN o sistema SHALL calcular o imposto devido sobre o ganho
4. WHEN o usuário vende FIIs THEN o sistema SHALL calcular o imposto sem aplicar a isenção de R$ 20.000
5. WHEN há prejuízo em uma venda THEN o sistema SHALL permitir compensação com ganhos futuros
6. WHEN o mês é encerrado THEN o sistema SHALL gerar um resumo mensal de ganhos de capital e impostos devidos

### Requirement 6: Geração de Relatório de IRPF

**User Story:** Como usuário Premium, eu quero gerar automaticamente um relatório completo para minha declaração de IRPF, para que eu economize horas de trabalho manual e evite erros na declaração.

#### Acceptance Criteria

1. WHEN o usuário Premium acessa o assistente de IRPF THEN o sistema SHALL permitir selecionar o ano fiscal desejado
2. WHEN o usuário solicita o relatório THEN o sistema SHALL calcular todas as informações necessárias em menos de 30 segundos
3. WHEN o relatório é gerado THEN ele SHALL incluir a ficha "Bens e Direitos" com todas as posições em 31/12
4. WHEN o relatório é gerado THEN ele SHALL incluir a ficha "Renda Variável" com apuração mensal de ganhos de capital
5. WHEN o usuário visualiza o relatório THEN o sistema SHALL apresentar os dados organizados conforme o programa da Receita Federal
6. WHEN o usuário clica em exportar THEN o sistema SHALL gerar um PDF formatado com todas as informações
7. IF o usuário não é Premium THEN o sistema SHALL bloquear o acesso e exibir um prompt de upgrade
8. WHEN o relatório é recalculado THEN o sistema SHALL usar cache para evitar processamento desnecessário

### Requirement 7: Segurança e Conformidade de Dados

**User Story:** Como usuário, eu quero ter certeza de que meus dados financeiros sensíveis estão protegidos com os mais altos padrões de segurança, para que eu possa confiar na plataforma com minhas informações patrimoniais.

#### Acceptance Criteria

1. WHEN credenciais de corretora são armazenadas THEN o sistema SHALL criptografá-las em nível de aplicação antes de salvar no banco
2. WHEN dados são transmitidos THEN o sistema SHALL usar criptografia TLS 1.3 ou superior
3. WHEN o usuário acessa dados sensíveis THEN o sistema SHALL validar autenticação e autorização
4. WHEN ocorre uma tentativa de acesso não autorizado THEN o sistema SHALL registrar o evento e bloquear o acesso
5. WHEN o usuário solicita exclusão de dados THEN o sistema SHALL remover permanentemente todas as informações conforme LGPD
6. WHEN o sistema processa dados pessoais THEN ele SHALL manter conformidade total com a LGPD

### Requirement 8: Processamento em Background e Performance

**User Story:** Como usuário, eu quero que sincronizações e cálculos complexos aconteçam em segundo plano, para que a interface permaneça responsiva e minha experiência não seja impactada.

#### Acceptance Criteria

1. WHEN a sincronização de dados é iniciada THEN ela SHALL executar em background sem bloquear a UI
2. WHEN cálculos complexos são necessários THEN o sistema SHALL processá-los de forma assíncrona
3. WHEN o dashboard é acessado THEN ele SHALL carregar em menos de 2 segundos
4. WHEN múltiplas conexões são sincronizadas THEN o sistema SHALL processar em paralelo quando possível
5. IF um job de background falhar THEN o sistema SHALL implementar retry com backoff exponencial
6. WHEN o sistema está sob alta carga THEN ele SHALL manter tempos de resposta aceitáveis através de cache e otimizações

### Requirement 9: Insights e Notificações Fiscais

**User Story:** Como investidor, eu quero receber alertas proativos sobre obrigações fiscais, para que eu nunca perca prazos ou cometa erros na apuração de impostos.

#### Acceptance Criteria

1. WHEN o usuário vende mais de R$ 20.000 em ações no mês THEN o sistema SHALL notificá-lo sobre a obrigação de apurar ganho de capital
2. WHEN o prazo de pagamento de DARF se aproxima THEN o sistema SHALL enviar um lembrete ao usuário
3. WHEN há prejuízo acumulado THEN o sistema SHALL sugerir estratégias de compensação
4. WHEN o período de declaração de IRPF se aproxima THEN o sistema SHALL notificar o usuário para revisar seus dados
5. WHEN há inconsistências nos dados THEN o sistema SHALL alertar o usuário com sugestões de correção
6. WHEN o usuário visualiza insights THEN eles SHALL ser acionáveis e incluir próximos passos claros

### Requirement 10: Suporte a Múltiplos Tipos de Ativos

**User Story:** Como investidor diversificado, eu quero que o sistema suporte diferentes tipos de ativos com suas regras fiscais específicas, para que eu tenha uma gestão completa de todo meu portfólio.

#### Acceptance Criteria

1. WHEN o sistema processa transações THEN ele SHALL suportar ações, BDRs, ETFs, FIIs, renda fixa e criptomoedas
2. WHEN o imposto é calculado para FIIs THEN o sistema SHALL aplicar as regras específicas (sem isenção de R$ 20k)
3. WHEN o imposto é calculado para ações THEN o sistema SHALL aplicar a isenção de R$ 20k no mercado à vista
4. WHEN o sistema exibe posições THEN ele SHALL categorizar corretamente cada tipo de ativo
5. WHEN o relatório de IRPF é gerado THEN ele SHALL separar os ativos conforme exigido pela Receita Federal
6. IF um novo tipo de ativo for adicionado THEN o sistema SHALL permitir extensão sem quebrar funcionalidades existentes
