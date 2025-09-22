// Teste simples da API Gemini
// Execute no console do navegador para testar a conectividade

const testGeminiAPI = async () => {
  const API_KEY = "AIzaSyD918kJyTaAlXtxXrfoBMjdwnxWLk0yqaw";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{
        text: "Teste: responda apenas 'API funcionando' se você conseguir processar esta mensagem."
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50,
    }
  };

  try {
    console.log('🧪 Testando API Gemini...');
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Resposta completa:', data);
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      console.log('✅ Texto da resposta:', data.candidates[0].content.parts[0].text);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
};

// Descomente a linha abaixo para executar o teste
// testGeminiAPI();