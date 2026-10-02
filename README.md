# Load Testing with k6

Bu repo, `localhost:3000` üzerinde çalışan uygulamaya yük testi gönderen k6 script'lerini içerir.

## Çalıştırma

1. k6 kurulumunu yapın: https://k6.io/docs/get-started/installation/
2. Hedef uygulamayı başlatın (ör. backend `localhost:3000` açılmalı)
3. Script çalıştırın:

```bash
k6 run test.js
```

İsterseniz diğer script'leri de aynı şekilde çalıştırabilirsiniz:

```bash
k6 run test2.js
k6 run test10.js
```

Not: Script'ler varsayılan olarak `http://localhost:3000` adresine hit atar; bu adresin çalışıyor olması gerekir.
