package com.riskalert.overlay;

import android.app.Activity;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.WindowManager;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.graphics.Color;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "RiskOverlay")
public class RiskOverlayPlugin extends Plugin {

    private WindowManager windowManager;
    private View overlayView;
    private boolean isOverlayShowing = false;

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                || Settings.canDrawOverlays(getContext());
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void showOverlay(PluginCall call) {
        String message = call.getString("message", "⚠️ Atenção!");
        int duration = call.getInt("duration", 5000);

        // Verifica permissão (Android M+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(getContext())) {
            call.reject("Permissão de overlay não concedida.");
            return;
        }

        if (isOverlayShowing) {
            // Se já estiver visível, só atualiza o texto
            TextView tv = overlayView.findViewById(
                    getContext().getResources().getIdentifier("overlayText", "id", getContext().getPackageName()));
            tv.setText(message);
            call.resolve();
            return;
        }

        Activity activity = getActivity();
        windowManager = (WindowManager) activity.getSystemService(Activity.WINDOW_SERVICE);

        // Infla o novo layout simplificado
        LayoutInflater inflater = LayoutInflater.from(activity);
        int layoutId = activity.getResources().getIdentifier(
                "overlay_layout", "layout", activity.getPackageName());
        overlayView = inflater.inflate(layoutId, null);

        // Define a mensagem no TextView
        TextView tvMessage = overlayView.findViewById(
                activity.getResources().getIdentifier("overlayText", "id", activity.getPackageName()));
        tvMessage.setText(message);

        // Botão FECHAR
        Button btnClose = overlayView.findViewById(
                activity.getResources().getIdentifier("overlay_close_button", "id", activity.getPackageName()));
        btnClose.setOnClickListener(v -> removeOverlay());

        // Parâmetros do WindowManager (full screen match_parent)
        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        // Centraliza verticalmente; se quiser descer um pouco, altere o gravity
        params.gravity = Gravity.CENTER;

        windowManager.addView(overlayView, params);
        isOverlayShowing = true;

        // Remove automaticamente após “duration” ms (se > 0)
        if (duration > 0) {
            overlayView.postDelayed(this::removeOverlay, duration);
        }

        call.resolve();
    }

    @PluginMethod
    public void hideOverlay(PluginCall call) {
        removeOverlay();
        call.resolve();
    }

    private void updateOverlay(String message, String color) {
        if (overlayView == null) {
            return;
        }
        // Atualiza texto
        TextView tv = overlayView.findViewById(
                getContext().getResources().getIdentifier("overlayText", "id", getContext().getPackageName()));
        tv.setText(message);
        tv.setBackgroundColor(Color.parseColor(color));
    }

    private void removeOverlay() {
        if (!isOverlayShowing || overlayView == null || windowManager == null) {
            return;
        }
        windowManager.removeView(overlayView);
        overlayView = null;
        isOverlayShowing = false;
    }
}
