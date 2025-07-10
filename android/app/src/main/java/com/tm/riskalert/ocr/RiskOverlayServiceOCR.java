package com.tm.riskalert.ocr;

import android.app.*;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.media.projection.MediaProjection;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.view.*;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.tm.riskalert.R;
import com.tm.riskalert.ocr.utils.RiskUtils;

public class RiskOverlayServiceOCR extends Service {

    private static MediaProjection mediaProjection;

    private WindowManager windowManager;
    private View overlayView;
    private TextView txtRisco, txtRendimento, txtMelhor;

    private Handler handler = new Handler();
    private boolean isReading = true;
    private final int INTERVAL_MS = 3000;

    private static final int NOTIFICATION_ID = 1;
    private static final String CHANNEL_ID = "risk_ocr_channel";

    public static void setMediaProjection(MediaProjection projection) {
        mediaProjection = projection;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        criarCanalNotificacao();
        iniciarForeground();

        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null);

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY :
                        WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP;

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        windowManager.addView(overlayView, params);

        txtRisco = overlayView.findViewById(R.id.txtRisco);
        txtRendimento = overlayView.findViewById(R.id.txtRendimento);
        txtMelhor = overlayView.findViewById(R.id.txtMelhor);

        iniciarLeituraOCRLoop();
    }

    private void iniciarLeituraOCRLoop() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!isReading || mediaProjection == null) {
                    handler.postDelayed(this, INTERVAL_MS);
                    return;
                }

                Bitmap screenshot = ScreenCaptureHelper.capture(mediaProjection);
                if (screenshot != null) {
                    new OCRProcessor().process(screenshot, new OCRProcessor.OCRCallback() {
                        @Override
                        public void onResult(String text) {
                            atualizarComTexto(text);
                        }

                        @Override
                        public void onError(Exception e) {
                            txtRisco.setText("Erro OCR: " + e.getMessage());
                        }
                    });
                } else {
                    txtRisco.setText("Captura de tela falhou");
                }

                handler.postDelayed(this, INTERVAL_MS);
            }
        }, INTERVAL_MS);
    }

    private void atualizarComTexto(String texto) {
        try {
            double valor = RiskUtils.extrairNumero(texto.split("R\\$")[1]);
            double minutos = texto.contains("min") ? RiskUtils.extrairNumero(texto.split("min")[0]) : 0;
            double km = texto.contains("km") ? RiskUtils.extrairNumero(texto.split("km")[0]) : 0;

            double kmRate = RiskEvaluator.calcKmRate(valor, km);
            double hrRate = RiskEvaluator.calcHrRate(valor, minutos);
            String melhor = RiskEvaluator.avaliarMelhor(kmRate, hrRate);
            String local = RiskUtils.extrairCepOuBairro(texto);

            txtRisco.setText("📍 " + local);
            txtRendimento.setText(String.format("💰 R$ %.2f/km | R$ %.2f/h", kmRate, hrRate));
            txtMelhor.setText(melhor);
        } catch (Exception e) {
            txtRisco.setText("Texto inválido");
        }
    }

    private void criarCanalNotificacao() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "OCR em segundo plano",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Leitura de tela ativa para exibir dados de risco");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void iniciarForeground() {
        Intent notificationIntent = new Intent(this, getApplicationContext().getClass());
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("OCR Ativo")
                .setContentText("Leitura de tela em andamento...")
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentIntent(pendingIntent)
                .build();

        startForeground(NOTIFICATION_ID, notification);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isReading = false;
        handler.removeCallbacksAndMessages(null);
        if (overlayView != null) windowManager.removeView(overlayView);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
