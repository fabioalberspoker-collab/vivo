-- Script para testar a funcionalidade de visualização de documentos
-- Este script adiciona URLs de documentos de teste aos contratos existentes

-- Atualizando alguns contratos com URLs de documentos de exemplo
UPDATE contracts 
SET documento_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
WHERE numero_contrato LIKE '%001%' 
LIMIT 1;

UPDATE contracts 
SET documento_url = 'https://sample-pdf.org/sample-pdf.pdf'
WHERE numero_contrato LIKE '%002%' 
LIMIT 1;

UPDATE contracts 
SET documento_url = 'https://www.orimi.com/pdf-test.pdf'
WHERE numero_contrato LIKE '%003%' 
LIMIT 1;

-- Verificar os contratos atualizados
SELECT numero_contrato, fornecedor, documento_url 
FROM contracts 
WHERE documento_url IS NOT NULL 
LIMIT 5;