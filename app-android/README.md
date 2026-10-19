# Jogaí (app Android)
Casca Expo/WebView de https://jogai-iota.vercel.app — atualizações do site aparecem no app sem nova build.

    npm install
    npx eas-cli login
    npx eas-cli init            # vincula ao seu projeto no expo.dev
    npx eas-cli build -p android --profile preview   # gera o APK
