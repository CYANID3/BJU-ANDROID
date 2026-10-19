package kg.bju.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(BjuNativePlugin.class);
        super.onCreate(savedInstanceState);
        // системная полоса прокрутки и «резиновый» эффект на краю страницы (растяжение в Android 12+) — их CSS не убирает:
        // растяжение сдвигает всю страницу под жестами «потянуть вверх/вниз», и индикатор жеста дёргается
        try {
            WebView w = getBridge() != null ? getBridge().getWebView() : null;
            if (w != null) {
                w.setVerticalScrollBarEnabled(false);
                w.setHorizontalScrollBarEnabled(false);
                w.setOverScrollMode(View.OVER_SCROLL_NEVER);
            }
        } catch (Exception ignored) { }
    }

    // После блокировки экрана WebView иногда не рисует новый кадр, пока его не коснутся: виден только фон.
    // При возврате (и когда окно снова получило фокус) просим WebView перерисоваться — сразу и ещё раз чуть позже.
    @Override
    public void onResume() {
        super.onResume();
        redraw();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) redraw();
    }

    private void redraw() {
        try {
            final WebView w = getBridge() != null ? getBridge().getWebView() : null;
            if (w == null) return;
            w.invalidate();
            w.postDelayed(() -> { w.requestLayout(); w.invalidate(); }, 120);
        } catch (Exception ignored) { }
    }
}
