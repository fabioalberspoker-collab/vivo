// Script para adicionar URLs de documentos de teste
// Execute este script no console do navegador para testar a funcionalidade

// Exemplo de como atualizar um contrato com URL de documento via JavaScript
const testDocumentUrl = async () => {
  const { createClient } = window.supabase || {};
  
  if (!createClient) {
    console.log('Supabase não está disponível no console. Use o SQL script fornecido.');
    return;
  }

  // URLs de PDFs de teste públicos
  const testUrls = [
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'https://www.orimi.com/pdf-test.pdf',
    'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf'
  ];

  console.log('URLs de teste para documentos:', testUrls);
  console.log('Execute o SQL script test_documento_urls.sql no Supabase para adicionar essas URLs aos contratos');
};

testDocumentUrl();