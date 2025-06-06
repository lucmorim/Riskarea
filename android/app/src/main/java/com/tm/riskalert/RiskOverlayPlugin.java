package com.riskalert.overlay;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin para exibir um overlay de alerta de risco.
 */
@CapacitorPlugin(name = "RiskOverlay")
public class RiskOverlayPlugin extends Plugin {

    private FrameLayout overlayView;
    private boolean overlayVisible = false;

    @Override
    public void load() {
        // Nenhuma inicialização adicional necessária ao carregar o plugin.
    }

    /**
     * Exibe um overlay com mensagem de alerta.
     * Requer API >= 23 para verificar a permissão SYSTEM_ALERT_WINDOW.
     */
    @PluginMethod
    public void showOverlay(PluginCall call) {
        Context context = getContext();

        // Obtém a mensagem do call
        String message = call.getString("message", "Área de risco!");

        // Se a versão for >= 23, verifica se há permissão para desenhar sobre outras apps
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(context)) {
                // Solicita permissão de overlay abrindo a tela de configurações
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                call.reject("Permissão de overlay não concedida");
                return;
            }
        }

        // Se já existe um overlay visível, não adiciona outro
        if (overlayVisible) {
            call.resolve();
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity não disponível para exibir overlay");
            return;
        }

        // Cria dinamicamente a View do overlay
        overlayView = new FrameLayout(context);
        overlayView.setLayoutParams(
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        );
        overlayView.setBackgroundColor(0xCCFF0000); // Fundo vermelho semi-transparente

        TextView textView = new TextView(context);
        textView.setText(message);
        textView.setTextSize(24);
        textView.setTextColor(0xFFFFFFFF);
        textView.setPadding(50, 50, 50, 50);

        overlayView.addView(textView);

        // Configura parâmetros de layout para a WindowManager
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            android.graphics.PixelFormat.TRANSLUCENT
        );

        // Adiciona a View à janela
        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        if (wm != null) {
            wm.addView(overlayView, params);
            overlayVisible = true;
        }

        // Resolve o call imediatamente; o usuário pode remover tocando no overlay
        call.resolve();
    }

    /**
     * Remove o overlay de alerta se estiver visível.
     */
    @PluginMethod
    public void hideOverlay(PluginCall call) {
        if (!overlayVisible || overlayView == null) {
            call.resolve();
            return;
        }

        Context context = getContext();
        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        if (wm != null) {
            wm.removeView(overlayView);
            overlayVisible = false;
            overlayView = null;
        }

        call.resolve();
    }
}
