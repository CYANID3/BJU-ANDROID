package kg.bju.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(BjuNativePlugin.class);
        super.onCreate(savedInstanceState);
        // системная полоса прокрутки WebView (CSS её не убирает): в приложении она не нужна
        try {
            WebView w = getBridge() != null ? getBridge().getWebView() : null;
            if (w != null) {
                w.setVerticalScrollBarEnabled(false);
                w.setHorizontalScrollBarEnabled(false);
            }
        } catch (Exception ignored) { }
    }
}
