09:36:56.304 Running build in Washington, D.C., USA (East) – iad1
09:36:56.305 Build machine configuration: 2 cores, 8 GB
09:36:56.319 Cloning github.com/fabioalberspoker-collab/vivo (Branch: main, Commit: c6b34f1)
09:36:56.474 Previous build caches not available
09:36:56.754 Cloning completed: 434.000ms
09:36:57.066 Running "vercel build"
09:36:57.459 Vercel CLI 48.0.3
09:36:57.804 Installing dependencies...
09:37:01.768 npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
09:37:02.158 npm warn deprecated npmlog@5.0.1: This package is no longer supported.
09:37:02.509 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
09:37:03.002 npm warn deprecated gauge@3.0.2: This package is no longer supported.
09:37:03.445 npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
09:37:04.834 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
09:37:04.961 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
09:37:04.979 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
09:37:20.799 
09:37:20.800 added 533 packages in 22s
09:37:20.801 
09:37:20.801 104 packages are looking for funding
09:37:20.801   run `npm fund` for details
09:37:20.852 Detected Next.js version: 15.5.3
09:37:20.859 Running "npm run build"
09:37:20.975 
09:37:20.975 > vite_react_shadcn_ts@0.0.0 build
09:37:20.975 > vite build
09:37:20.975 
09:37:21.330 [36mvite v5.4.19 [32mbuilding for production...[36m[39m
09:37:21.379 transforming...
09:37:25.559 node_modules/pdfjs-dist/build/pdf.js (1982:23): Use of eval in "node_modules/pdfjs-dist/build/pdf.js" is strongly discouraged as it poses security risks and may cause issues with minification.
09:37:27.008 [32m✓[39m 1821 modules transformed.
09:37:27.500 rendering chunks...
09:37:27.522 computing gzip size...
09:37:27.548 [2mdist/[22m[32mindex.html                 [39m[1m[2m  1.19 kB[22m[1m[22m[2m │ gzip:   0.49 kB[22m
09:37:27.548 [2mdist/[22m[2massets/[22m[35mindex-DPj2hi_S.css  [39m[1m[2m 61.78 kB[22m[1m[22m[2m │ gzip:  10.87 kB[22m
09:37:27.548 [2mdist/[22m[2massets/[22m[36mindex-Cnkvs4wn.js   [39m[1m[33m964.90 kB[39m[22m[2m │ gzip: 278.61 kB[22m
09:37:27.549 [33m
09:37:27.549 (!) Some chunks are larger than 500 kB after minification. Consider:
09:37:27.550 - Using dynamic import() to code-split the application
09:37:27.550 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
09:37:27.550 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
09:37:27.550 [32m✓ built in 6.20s[39m
09:37:27.599 Error: The file "/vercel/path0/.next/routes-manifest.json" couldn't be found. This is often caused by a misconfiguration in your project.
09:37:27.600 Learn More: https://err.sh/vercel/vercel/now-next-routes-manifest