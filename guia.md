Passos Consolidados (Guia Rápido)
Reinstalação limpa do plugin:

bash
Copy
npm uninstall @capacitor/background-runner
npm install @capacitor/background-runner@latest
Sincronização correta:

bash
Copy
npx cap add android
npx cap sync android
Estrutura de pastas crítica:

bash
Copy
mkdir -p android/capacitor-cordova-android-plugins/src/main/libs/
(Onde o arquivo .aar deve residir)

Configuração do Gradle (em android/build.gradle):

gradle
Copy
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://repo.capacitorjs.com/artifactory/libs-release' }
    }
}
Próximos Passos Recomendados
Teste em modo release:

bash
Copy
cd android
./gradlew assembleRelease
Verifique no dispositivo físico:

Conecte um dispositivo Android via USB

Execute:

bash
Copy
npx cap run android
Monitoramento de bateria:

Como o plugin roda em background, verifique no Android Studio:

Copy
Logcat > Filtrar por "BackgroundRunner"
Caso o Problema Reapareça
Solução rápida:

bash
Copy
rm -rf android
npx cap add android
npx cap sync
Verifique atualizações:

bash
Copy
npm outdated
Documentação oficial:
Consulte sempre o repositório oficial do plugin para atualizações críticas.

Dica Profissional
Crie um arquivo debug_logs.sh na raiz do projeto com:

bash
Copy
#!/bin/bash
cd android
./gradlew clean
./gradlew assembleDebug --stacktrace > ../debug_logs.txt 2>&1
echo "Logs salvos em debug_logs.txt"
Execute com:

bash
Copy
chmod +x debug_logs.sh
./debug_logs.sh


instalar o risk-overlay
npm install ./risk-overlay