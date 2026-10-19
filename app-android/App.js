import { useRef, useState, useEffect } from "react";
import { BackHandler, View, ActivityIndicator, Text, StyleSheet, Pressable, StatusBar } from "react-native";
import { WebView } from "react-native-webview";

const SITE = "https://jogai-iota.vercel.app";

export default function App() {
  const web = useRef(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const h = BackHandler.addEventListener("hardwareBackPress", () => {
      if (podeVoltar && web.current) { web.current.goBack(); return true; }
      return false;
    });
    return () => h.remove();
  }, [podeVoltar]);

  return (
    <View style={s.tela}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0b1e" />
      {erro ? (
        <View style={s.centro}>
          <Text style={s.txt}>Sem conexão com o Jogaí.</Text>
          <Pressable style={s.btn} onPress={() => { setErro(false); web.current && web.current.reload(); }}><Text style={s.btnTxt}>Tentar de novo</Text></Pressable>
        </View>
      ) : (
        <WebView
          ref={web}
          source={{ uri: SITE }}
          style={s.tela}
          originWhitelist={["https://*"]}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => <View style={s.centro}><ActivityIndicator size="large" color="#ffd23f" /></View>}
          onNavigationStateChange={(n) => setPodeVoltar(n.canGoBack)}
          onError={() => setErro(true)}
          onHttpError={() => {}}
          onShouldStartLoadWithRequest={(r) => {
            // links de fora do Jogaí (e do login Google/Supabase) seguem dentro; só bloqueia esquemas estranhos
            return r.url.startsWith("https://");
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#0d0b1e" },
  centro: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#0d0b1e", gap: 16 },
  txt: { color: "#fff", fontSize: 16 },
  btn: { backgroundColor: "#ffd23f", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  btnTxt: { fontWeight: "700", color: "#1a1500" },
});
