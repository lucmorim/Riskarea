package com.tm.riskalert;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.getcapacitor.Bridge;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class RiskLocationService extends Service {

    private static final String TAG = "RiskLocationService";
    private static final String CHANNEL_ID = "RiskLocationChannel";
    private static final int NOTIFICATION_ID = 1001;
    private static final float MIN_DISPLACEMENT_METERS = 500f;

    private FusedLocationProviderClient fusedClient;
    private LocationRequest locationRequest;
    private LocationCallback locationCallback;

    // Bridge do Capacitor — preenchida em MainActivity.onCreate()
    public static Bridge capacitorBridge;

    // Cliente HTTP para consultas ao servidor
    private final OkHttpClient httpClient = new OkHttpClient();

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "onCreate: Serviço criado");
        createNotificationChannel();
        setupLocationClient();

        if (MainActivity.capacitorBridge == null) {
            Log.e(TAG, "Bridge do Capacitor está nulo! Abra MainActivity primeiro.");
        } else {
            Log.d(TAG, "Bridge do Capacitor carregado com sucesso.");
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Serviço de Risco (Localização)",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitora localização e verifica áreas de risco.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void setupLocationClient() {
        fusedClient = LocationServices.getFusedLocationProviderClient(this);

        locationRequest = LocationRequest.create();
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(MIN_DISPLACEMENT_METERS);
        locationRequest.setInterval(15_000);
        locationRequest.setFastestInterval(5_000);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                if (result == null) return;
                for (Location loc : result.getLocations()) {
                    double lat = loc.getLatitude();
                    double lon = loc.getLongitude();
                    Log.d(TAG, "Local recebido: (" + lat + ", " + lon + ")");

                    // Chama o servidor via POST para verificar área de risco
                    checkRiskOnServer(lat, lon);
                }
            }
        };
    }

    private Notification buildForegroundNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Rastreamento de Localização")
            .setContentText("Monitorando deslocamento e áreas de risco")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand: Serviço entrou em foreground");
        startForeground(NOTIFICATION_ID, buildForegroundNotification());
        startLocationUpdates();
        return START_STICKY;
    }

    private void startLocationUpdates() {
        try {
            fusedClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            );
            Log.d(TAG, "startLocationUpdates: solicitados updates a cada ≥ 50 m");
        } catch (SecurityException e) {
            Log.e(TAG, "Permissão de localização ausente.", e);
        }
    }

    private void stopLocationUpdates() {
        fusedClient.removeLocationUpdates(locationCallback);
        Log.d(TAG, "stopLocationUpdates: updates removidos");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy: Serviço destruído, parando updates");
        stopLocationUpdates();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /**
     * Realiza POST em https://copiloto.glitch.me/check-risk-area
     * com JSON {"lat": ..., "lon": ...}. Se "alert": true, exibe overlay com "menssage".
     */
    private void checkRiskOnServer(double lat, double lon) {
        String url = "https://lumotech.com.br/check-risk-area";

        // Monta payload JSON
        JSONObject payload = new JSONObject();
        try {
            payload.put("latitude", lat);
            payload.put("longitude", lon);
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao montar JSON de requisição: " + e.getMessage());
            return;
        }

        RequestBody body = RequestBody.create(JSON, payload.toString());

        Request request = new Request.Builder()
            .url(url)
            .post(body)
            .build();

        Log.d(TAG, "Chamando POST em " + url + " com payload: " + payload.toString());

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Erro ao consultar servidor (POST): " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                int code = response.code();
                String respBody = response.body() != null ? response.body().string() : "";
                Log.d(TAG, "HTTP Status Code (POST) = " + code);
                Log.d(TAG, "Corpo da resposta (POST) = " + respBody);
                response.close();

                if (code != 200) {
                    Log.e(TAG, "Resposta inesperada do servidor (POST): " + respBody);
                    return;
                }

                try {
                    JSONObject json = new JSONObject(respBody);
                    boolean alerta = json.optBoolean("alert", false);
                    String mensagem = json.optString("menssage", "Você está em área de risco!");

                    Log.d(TAG, "Resposta POST do servidor: alert=" + alerta +
                                 ", menssage=" + mensagem);

                    if (alerta) {
                        showRiskOverlayViaPlugin(mensagem);
                    }
                } catch (JSONException ex) {
                    Log.e(TAG, "JSON inválido na resposta (POST): " + ex.getMessage());
                }
            }
        });
    }

    /**
     * Invoca o plugin RiskOverlay via JavaScript no WebView do Capacitor.
     */
    private void showRiskOverlayViaPlugin(String message) {
        if (MainActivity.capacitorBridge == null) {
            Log.e(TAG, "Bridge do Capacitor nulo. Não é possível exibir overlay.");
            return;
        }
        String js = "window.Capacitor.Plugins.RiskOverlay.showOverlay({ message: \"" +
                    message.replace("\"", "\\\"") + "\" });";
        MainActivity.capacitorBridge.getActivity().runOnUiThread(() -> {
            MainActivity.capacitorBridge.getWebView().evaluateJavascript(js, null);
        });
        Log.d(TAG, "showRiskOverlayViaPlugin: overlay disparado com mensagem: " + message);
    }
}
