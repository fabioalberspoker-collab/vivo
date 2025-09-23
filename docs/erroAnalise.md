Iniciando análise do contrato: Contrato CT-2025-042
supabaseStorageService.ts:92 ⬇️ Tentando baixar arquivo: contracts/CT-2025-042.json
supabaseStorageService.ts:116 ⬇️ Baixando de bucket: contracts/contracts/CT-2025-042.json
supabaseStorageService.ts:120  GET https://jstytygxbnapydwkvpzk.supabase.co/storage/v1/object/contracts/contracts/CT-2025-042.json 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4293
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4314
fulfilled @ @supabase_supabase-js.js?v=4c64d2e0:4266
Promise.then
step @ @supabase_supabase-js.js?v=4c64d2e0:4279
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4281
__awaiter6 @ @supabase_supabase-js.js?v=4c64d2e0:4263
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4304
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3279
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3279
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3370
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3369
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3333
__awaiter3 @ @supabase_supabase-js.js?v=4c64d2e0:3315
_handleRequest @ @supabase_supabase-js.js?v=4c64d2e0:3368
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3382
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3333
__awaiter3 @ @supabase_supabase-js.js?v=4c64d2e0:3315
get @ @supabase_supabase-js.js?v=4c64d2e0:3381
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3742
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3431
__awaiter4 @ @supabase_supabase-js.js?v=4c64d2e0:3413
download @ @supabase_supabase-js.js?v=4c64d2e0:3735
downloadFile @ supabaseStorageService.ts:120
analyzeContract @ contractAnalysisService.ts:75
analyzeMultipleContracts @ contractAnalysisService.ts:209
await in analyzeMultipleContracts
analyzeContracts @ useContractAnalysis.ts:33
handleExportReport @ Header.tsx:28
callCallback2 @ chunk-I3COAS7K.js?v=4c64d2e0:3674
invokeGuardedCallbackDev @ chunk-I3COAS7K.js?v=4c64d2e0:3699
invokeGuardedCallback @ chunk-I3COAS7K.js?v=4c64d2e0:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-I3COAS7K.js?v=4c64d2e0:3736
executeDispatch @ chunk-I3COAS7K.js?v=4c64d2e0:7014
processDispatchQueueItemsInOrder @ chunk-I3COAS7K.js?v=4c64d2e0:7034
processDispatchQueue @ chunk-I3COAS7K.js?v=4c64d2e0:7043
dispatchEventsForPlugins @ chunk-I3COAS7K.js?v=4c64d2e0:7051
(anonymous) @ chunk-I3COAS7K.js?v=4c64d2e0:7174
batchedUpdates$1 @ chunk-I3COAS7K.js?v=4c64d2e0:18913
batchedUpdates @ chunk-I3COAS7K.js?v=4c64d2e0:3579
dispatchEventForPluginEventSystem @ chunk-I3COAS7K.js?v=4c64d2e0:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-I3COAS7K.js?v=4c64d2e0:5478
dispatchEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5472
dispatchDiscreteEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5449Understand this error
supabaseStorageService.ts:123 ❌ Erro ao baixar do storage: StorageUnknownError: {}
    at @supabase_supabase-js.js?v=4c64d2e0:3348:12
    at Generator.next (<anonymous>)
    at fulfilled (@supabase_supabase-js.js?v=4c64d2e0:3318:24)
overrideMethod @ hook.js:608
downloadFile @ supabaseStorageService.ts:123
await in downloadFile
analyzeContract @ contractAnalysisService.ts:75
analyzeMultipleContracts @ contractAnalysisService.ts:209
await in analyzeMultipleContracts
analyzeContracts @ useContractAnalysis.ts:33
handleExportReport @ Header.tsx:28
callCallback2 @ chunk-I3COAS7K.js?v=4c64d2e0:3674
invokeGuardedCallbackDev @ chunk-I3COAS7K.js?v=4c64d2e0:3699
invokeGuardedCallback @ chunk-I3COAS7K.js?v=4c64d2e0:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-I3COAS7K.js?v=4c64d2e0:3736
executeDispatch @ chunk-I3COAS7K.js?v=4c64d2e0:7014
processDispatchQueueItemsInOrder @ chunk-I3COAS7K.js?v=4c64d2e0:7034
processDispatchQueue @ chunk-I3COAS7K.js?v=4c64d2e0:7043
dispatchEventsForPlugins @ chunk-I3COAS7K.js?v=4c64d2e0:7051
(anonymous) @ chunk-I3COAS7K.js?v=4c64d2e0:7174
batchedUpdates$1 @ chunk-I3COAS7K.js?v=4c64d2e0:18913
batchedUpdates @ chunk-I3COAS7K.js?v=4c64d2e0:3579
dispatchEventForPluginEventSystem @ chunk-I3COAS7K.js?v=4c64d2e0:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-I3COAS7K.js?v=4c64d2e0:5478
dispatchEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5472
dispatchDiscreteEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5449Understand this error
supabaseStorageService.ts:127 🔄 Tentando com bucket "contratos"...
supabaseStorageService.ts:130  GET https://jstytygxbnapydwkvpzk.supabase.co/storage/v1/object/contratos/contracts/CT-2025-042.json 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4293
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4314
fulfilled @ @supabase_supabase-js.js?v=4c64d2e0:4266
Promise.then
step @ @supabase_supabase-js.js?v=4c64d2e0:4279
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4281
__awaiter6 @ @supabase_supabase-js.js?v=4c64d2e0:4263
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:4304
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3279
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3279
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3370
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3369
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3333
__awaiter3 @ @supabase_supabase-js.js?v=4c64d2e0:3315
_handleRequest @ @supabase_supabase-js.js?v=4c64d2e0:3368
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3382
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3333
__awaiter3 @ @supabase_supabase-js.js?v=4c64d2e0:3315
get @ @supabase_supabase-js.js?v=4c64d2e0:3381
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3742
(anonymous) @ @supabase_supabase-js.js?v=4c64d2e0:3431
__awaiter4 @ @supabase_supabase-js.js?v=4c64d2e0:3413
download @ @supabase_supabase-js.js?v=4c64d2e0:3735
downloadFile @ supabaseStorageService.ts:130
await in downloadFile
analyzeContract @ contractAnalysisService.ts:75
analyzeMultipleContracts @ contractAnalysisService.ts:209
await in analyzeMultipleContracts
analyzeContracts @ useContractAnalysis.ts:33
handleExportReport @ Header.tsx:28
callCallback2 @ chunk-I3COAS7K.js?v=4c64d2e0:3674
invokeGuardedCallbackDev @ chunk-I3COAS7K.js?v=4c64d2e0:3699
invokeGuardedCallback @ chunk-I3COAS7K.js?v=4c64d2e0:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-I3COAS7K.js?v=4c64d2e0:3736
executeDispatch @ chunk-I3COAS7K.js?v=4c64d2e0:7014
processDispatchQueueItemsInOrder @ chunk-I3COAS7K.js?v=4c64d2e0:7034
processDispatchQueue @ chunk-I3COAS7K.js?v=4c64d2e0:7043
dispatchEventsForPlugins @ chunk-I3COAS7K.js?v=4c64d2e0:7051
(anonymous) @ chunk-I3COAS7K.js?v=4c64d2e0:7174
batchedUpdates$1 @ chunk-I3COAS7K.js?v=4c64d2e0:18913
batchedUpdates @ chunk-I3COAS7K.js?v=4c64d2e0:3579
dispatchEventForPluginEventSystem @ chunk-I3COAS7K.js?v=4c64d2e0:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-I3COAS7K.js?v=4c64d2e0:5478
dispatchEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5472
dispatchDiscreteEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5449Understand this error
supabaseStorageService.ts:152 ❌ Erro no download do arquivo: Error: Erro ao baixar arquivo: {}
    at SupabaseStorageService.downloadFile (supabaseStorageService.ts:139:15)
    at async ContractAnalysisService.analyzeContract (contractAnalysisService.ts:75:26)
    at async ContractAnalysisService.analyzeMultipleContracts (contractAnalysisService.ts:209:24)
    at async analyzeContracts (useContractAnalysis.ts:33:23)
    at async handleExportReport (Header.tsx:28:5)
overrideMethod @ hook.js:608
downloadFile @ supabaseStorageService.ts:152
await in downloadFile
analyzeContract @ contractAnalysisService.ts:75
analyzeMultipleContracts @ contractAnalysisService.ts:209
await in analyzeMultipleContracts
analyzeContracts @ useContractAnalysis.ts:33
handleExportReport @ Header.tsx:28
callCallback2 @ chunk-I3COAS7K.js?v=4c64d2e0:3674
invokeGuardedCallbackDev @ chunk-I3COAS7K.js?v=4c64d2e0:3699
invokeGuardedCallback @ chunk-I3COAS7K.js?v=4c64d2e0:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-I3COAS7K.js?v=4c64d2e0:3736
executeDispatch @ chunk-I3COAS7K.js?v=4c64d2e0:7014
processDispatchQueueItemsInOrder @ chunk-I3COAS7K.js?v=4c64d2e0:7034
processDispatchQueue @ chunk-I3COAS7K.js?v=4c64d2e0:7043
dispatchEventsForPlugins @ chunk-I3COAS7K.js?v=4c64d2e0:7051
(anonymous) @ chunk-I3COAS7K.js?v=4c64d2e0:7174
batchedUpdates$1 @ chunk-I3COAS7K.js?v=4c64d2e0:18913
batchedUpdates @ chunk-I3COAS7K.js?v=4c64d2e0:3579
dispatchEventForPluginEventSystem @ chunk-I3COAS7K.js?v=4c64d2e0:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-I3COAS7K.js?v=4c64d2e0:5478
dispatchEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5472
dispatchDiscreteEvent @ chunk-I3COAS7K.js?v=4c64d2e0:5449Understand this error
contractAnalysisService.ts:174 ❌ Erro na análise de Contrato CT-2025-042: Error: Erro ao baixar arquivo: {}
    at SupabaseStorageService.downloadFile (supabaseStorageService.ts:139:15)
    at async ContractAnalysisService.analyzeContract (contractAnalysisService.ts:75:26)
    at async ContractAnalysisService.analyzeMultipleContracts (contractAnalysisService.ts:209:24)
    at async analyzeContracts (useContractAnalysis.ts:33:23)
    at async handleExportReport (Header.tsx:28:5)