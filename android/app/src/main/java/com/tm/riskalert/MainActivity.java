package com.tm.riskalert;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

import android.view.View;
import android.view.ViewGroup;
import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.content.pm.PackageManager;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import com.riskalert.overlay.RiskOverlayPlugin;

public class MainActivity extends BridgeActivity {

    public static Bridge capacitorBridge;

    private static final int REQUEST_LOCATION_PERMISSIONS = 1001;

    private FloatingActionButton fabToggle;
    private boolean isTracking = false;

    // Callback para solicitar permissão de overlay
    private final ActivityResultLauncher<Intent> overlayPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (!Settings.canDrawOverlays(this)) {
                    Toast.makeText(this, "Permissão de overlay negada.", Toast.LENGTH_SHORT).show();
                } else {
                    // Se concedeu overlay, prossegue para solicitar permissões de localização
                    checkAndRequestLocationPermissions();
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Registra o plugin RiskOverlay
        this.registerPlugin(RiskOverlayPlugin.class);

        super.onCreate(savedInstanceState);

        // Captura o Bridge do Capacitor
        capacitorBridge = this.getBridge();

        // “Inflar” apenas o layout que contém o FAB
        // (o próprio BridgeActivity gerencia o WebView do Ionic)
        View overlay = getLayoutInflater().inflate(R.layout.overlay_fab, null);
        addContentView(
                overlay,
                new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT));

        // Agora encontramos o FAB e configuramos o clique
        fabToggle = findViewById(R.id.fab_toggle_tracking);
        fabToggle.setOnClickListener(v -> {
            if (!isTracking) {
                startTrackingFlow();
            } else {
                stopRiskLocationService();
                isTracking = false;
                fabToggle.setImageResource(android.R.drawable.ic_media_play);
                fabToggle.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.fab_background_pause));
                fabToggle.setImageTintList(ContextCompat.getColorStateList(this, R.color.fab_icon_pause));
            }
        });
    }

    /**
     * Verifica permissão de overlay, e em seguida permissões de localização.
     * Chama startRiskLocationService() se tudo estiver OK, e troca o ícone para
     * “pause”.
     */
    private void startTrackingFlow() {
        // 1) Verifica permissão de overlay (necessária para exibir o overlay de risco)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            overlayPermissionLauncher.launch(intent);
        } else {
            // Se já tem permissão de overlay, avança para localização
            checkAndRequestLocationPermissions();
        }
    }

    /**
     * Verifica se já temos ACCESS_FINE_LOCATION e ACCESS_BACKGROUND_LOCATION
     * (Android Q+).
     * Se não, solicita. Se sim, chama startRiskLocationService().
     */
    private void checkAndRequestLocationPermissions() {
        boolean fineLoc = ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;

        boolean backgroundLoc = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            backgroundLoc = ContextCompat.checkSelfPermission(
                    this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }

        if (fineLoc && backgroundLoc) {
            // Permissões OK → inicia o serviço de rastreamento
            startRiskLocationService();
            isTracking = true;
            fabToggle.setImageResource(android.R.drawable.ic_media_pause);
            fabToggle.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.fab_background_play));
            fabToggle.setImageTintList(ContextCompat.getColorStateList(this, R.color.fab_icon_play));
            return;
        }

        // Senão, solicita as permissões necessárias
        String[] perms;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            perms = new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_BACKGROUND_LOCATION
            };
        } else {
            perms = new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION
            };
        }
        ActivityCompat.requestPermissions(this, perms, REQUEST_LOCATION_PERMISSIONS);
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_LOCATION_PERMISSIONS) {
            boolean allGranted = true;
            if (grantResults.length > 0) {
                for (int r : grantResults) {
                    if (r != PackageManager.PERMISSION_GRANTED) {
                        allGranted = false;
                        break;
                    }
                }
            } else {
                allGranted = false;
            }

            if (allGranted) {
                // Permissões concedidas → inicia o serviço
                startRiskLocationService();
                isTracking = true;

                // MESMA TINTA QUE EM checkAndRequestLocationPermissions()
                fabToggle.setImageResource(android.R.drawable.ic_media_pause);
                fabToggle.setBackgroundTintList(
                        ContextCompat.getColorStateList(this, R.color.fab_background_play));
                fabToggle.setImageTintList(
                        ContextCompat.getColorStateList(this, R.color.fab_icon_play));
            } else {
                Toast.makeText(
                        this,
                        "Permissões de localização são necessárias para rastrear!",
                        Toast.LENGTH_SHORT).show();
                // Garante que o ícone continue como “play” se o usuário negar
                isTracking = false;
                fabToggle.setImageResource(android.R.drawable.ic_media_play);
                fabToggle.setBackgroundTintList(
                        ContextCompat.getColorStateList(this, R.color.fab_background_pause));
                fabToggle.setImageTintList(
                        ContextCompat.getColorStateList(this, R.color.fab_icon_pause));
            }
        }
    }

    /**
     * Inicia o serviço em foreground de rastreamento de localização.
     */
    private void startRiskLocationService() {
        Intent serviceIntent = new Intent(this, RiskLocationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
        Toast.makeText(this, "Serviço de rastreamento iniciado", Toast.LENGTH_SHORT).show();
    }

    /**
     * Para o serviço de rastreamento de localização.
     */
    private void stopRiskLocationService() {
        Intent serviceIntent = new Intent(this, RiskLocationService.class);
        stopService(serviceIntent);
        Toast.makeText(this, "Serviço de rastreamento parado", Toast.LENGTH_SHORT).show();
    }
}
