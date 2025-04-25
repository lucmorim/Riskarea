package com.riskalert.overlay;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.WindowManager;
import android.view.View;
import android.widget.TextView;
import android.graphics.PixelFormat;
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

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = Settings.canDrawOverlays(getContext());
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName()));
        getActivity().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void showOverlay(PluginCall call) {
        String message = call.getString("message", "🚨 Atenção!");
        String color = call.getString("color", "#e53935");
        int duration = call.getInt("duration", 5000);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
            call.reject("Permissão de overlay não concedida.");
            return;
        }

        Activity activity = getActivity();
        windowManager = (WindowManager) activity.getSystemService(Activity.WINDOW_SERVICE);

        LayoutInflater inflater = LayoutInflater.from(activity);
        overlayView = inflater.inflate(
                activity.getResources().getIdentifier("overlay_layout", "layout", activity.getPackageName()),
                null);

        TextView textView = overlayView.findViewById(
                activity.getResources().getIdentifier("overlayText", "id", activity.getPackageName()));
        textView.setText(message);
        textView.setBackgroundColor(Color.parseColor(color));

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                        : WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        // o parametro abaixo faz descer o overlay.
        params.y = 250;

        windowManager.addView(overlayView, params);

        overlayView.postDelayed(() -> removeOverlay(), duration);

        call.resolve();
    }

    private void removeOverlay() {
        if (overlayView != null && windowManager != null) {
            windowManager.removeView(overlayView);
            overlayView = null;
        }
    }
}
