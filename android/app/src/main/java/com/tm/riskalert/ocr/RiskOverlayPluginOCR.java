package com.tm.riskalert.ocr;

import android.content.Intent;
import android.graphics.Bitmap;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "RiskOCR")
public class RiskOverlayPluginOCR extends Plugin {

    @PluginMethod
    public void startOCR(PluginCall call) {
        // Apenas uma leitura pontual simulada
        Bitmap fakeBitmap = Bitmap.createBitmap(300, 300, Bitmap.Config.ARGB_8888);

        OCRProcessor ocr = new OCRProcessor();
        ocr.process(fakeBitmap, new OCRProcessor.OCRCallback() {
            @Override
            public void onResult(String text) {
                Log.d("RiskOverlay", "Texto extraído: " + text);

                JSObject result = new JSObject();
                result.put("text", text);
                call.resolve(result);
            }

            @Override
            public void onError(Exception e) {
                call.reject("Erro ao processar OCR", e);
            }
        });
    }

    @PluginMethod
    public void startService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), RiskOverlayServiceOCR.class);
            getContext().startService(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Erro ao iniciar o serviço OCR", e);
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), RiskOverlayServiceOCR.class);
            getContext().stopService(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Erro ao parar o serviço OCR", e);
        }
    }

    @PluginMethod
    public void isTracking(PluginCall call) {
        // Isso pode ser aprimorado para verificar se o serviço está rodando de fato
        JSObject result = new JSObject();
        result.put("running", false); // ou true se rastreando
        call.resolve(result);
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        // Se desejar, pode redirecionar para startService
        startService(call);
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        stopService(call);
    }
}
