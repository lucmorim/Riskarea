package com.riskalert.overlay;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.tm.riskalert.RiskLocationService;
import android.app.ActivityManager;
import com.getcapacitor.JSObject;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.MobileAds;

/**
 * Plugin para exibir um overlay de alerta de risco simples com botão fechar e
 * texto completo.
 */
@CapacitorPlugin(name = "RiskOverlay")
public class RiskOverlayPlugin extends Plugin {

    private FrameLayout overlayView;
    private boolean overlayVisible = false;
    private boolean isTrackingActive = false;

    @Override
    public void load() {
        // Inicialização opcional
    }

    @PluginMethod
    public void showOverlay(PluginCall call) {
        new Handler(Looper.getMainLooper()).post(() -> {
            Context context = getContext();
            String message = call.getString("message", "Você está próximo de uma área de risco");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                call.reject("Permissão de overlay não concedida");
                return;
            }

            if (overlayVisible) {
                call.resolve();
                return;
            }

            Activity activity = getActivity();
            if (activity == null) {
                call.reject("Activity indisponível");
                return;
            }

            overlayView = new FrameLayout(context);
            overlayView.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT));
            overlayView.setBackgroundColor(0xCC000000);

            LinearLayout container = new LinearLayout(context);
            FrameLayout.LayoutParams ctrParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    Gravity.CENTER);
            int margin = (int) TypedValue.applyDimension(
                    TypedValue.COMPLEX_UNIT_DIP, 24, context.getResources().getDisplayMetrics());
            ctrParams.setMargins(margin, 0, margin, 0);
            container.setLayoutParams(ctrParams);
            container.setOrientation(LinearLayout.VERTICAL);
            container.setGravity(Gravity.CENTER);

            // Banner AdView do AdMob
            AdView adView = new AdView(context);
            adView.setAdSize(AdSize.BANNER);
            adView.setAdUnitId("ca-app-pub-4861242358977976/7980362480"); // Seu ID real
            adView.loadAd(new AdRequest.Builder().build());
            container.addView(adView);

            // Texto
            TextView textView = new TextView(context);
            textView.setText(message);
            textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
            textView.setTextColor(0xFFFFFFFF);
            textView.setGravity(Gravity.CENTER);
            int padding = (int) TypedValue.applyDimension(
                    TypedValue.COMPLEX_UNIT_DIP, 16, context.getResources().getDisplayMetrics());
            textView.setPadding(padding, padding, padding, padding);
            textView.setLayoutParams(new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT));
            container.addView(textView);

            // Botão Fechar
            Button closeBtn = new Button(context);
            closeBtn.setText("Fechar");
            LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT);
            btnParams.topMargin = padding;
            btnParams.gravity = Gravity.CENTER;
            closeBtn.setLayoutParams(btnParams);
            closeBtn.setOnClickListener(v -> hideOverlayInternal());
            container.addView(closeBtn);

            overlayView.addView(container);

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                            : WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                            | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    android.graphics.PixelFormat.TRANSLUCENT);

            WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
            if (wm != null) {
                wm.addView(overlayView, params);
                overlayVisible = true;
                new Handler(Looper.getMainLooper()).postDelayed(this::hideOverlayInternal, 10000);
            }

            call.resolve();
        });
    }

    private void hideOverlayInternal() {
        if (!overlayVisible || overlayView == null)
            return;
        Context c = getContext();
        WindowManager wm = (WindowManager) c.getSystemService(Context.WINDOW_SERVICE);
        if (wm != null)
            wm.removeView(overlayView);
        overlayVisible = false;
        overlayView = null;
    }

    @PluginMethod
    public void hideOverlay(PluginCall call) {
        hideOverlayInternal();
        call.resolve();
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), RiskLocationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        isTrackingActive = true;
        call.resolve();
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), RiskLocationService.class);
        getContext().stopService(serviceIntent);
        isTrackingActive = false;
        call.resolve();
    }

    @PluginMethod
    public void isTracking(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", isTrackingActive);
        call.resolve(result);
    }
}
