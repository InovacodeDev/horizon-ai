# Lib / Services / NFe Crawler

Sistema de crawler para buscar e processar notas fiscais eletrônicas automaticamente.

## Funcionalidades

- Busca automática de NFes em fontes configuradas
- Download e processamento de XMLs de NFe
- Extração de dados de produtos e valores
- Armazenamento estruturado no banco
- Tracking de preços de produtos

## Uso

O crawler pode ser executado:

- Manualmente via script
- Automaticamente via scheduled job
- Sob demanda via API

## Segurança

- Validação de XMLs
- Verificação de assinaturas digitais
- Sanitização de dados
- Rate limiting
