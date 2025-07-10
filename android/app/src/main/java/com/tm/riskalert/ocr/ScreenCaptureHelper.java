package com.tm.riskalert.ocr;

import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import java.nio.ByteBuffer;

public class ScreenCaptureHelper {

    private static VirtualDisplay virtualDisplay;
    private static ImageReader imageReader;

    public static Bitmap capture(MediaProjection mediaProjection) {
        try {
            if (mediaProjection == null) return null;

            // 📐 Pega dimensões da tela
            WindowManager windowManager = (WindowManager) AppContext.getContext().getSystemService(WindowManager.class);
            DisplayMetrics metrics = new DisplayMetrics();
            windowManager.getDefaultDisplay().getRealMetrics(metrics);

            int width = metrics.widthPixels;
            int height = metrics.heightPixels;
            int density = metrics.densityDpi;

            if (imageReader == null) {
                imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2);
            }

            if (virtualDisplay == null) {
                virtualDisplay = mediaProjection.createVirtualDisplay(
                        "RiskScreenCapture",
                        width,
                        height,
                        density,
                        DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                        imageReader.getSurface(),
                        null,
                        null
                );
            }

            Image image = imageReader.acquireLatestImage();
            if (image == null) return null;

            Image.Plane[] planes = image.getPlanes();
            ByteBuffer buffer = planes[0].getBuffer();
            int pixelStride = planes[0].getPixelStride();
            int rowStride = planes[0].getRowStride();
            int rowPadding = rowStride - pixelStride * width;

            Bitmap bitmap = Bitmap.createBitmap(
                    width + rowPadding / pixelStride,
                    height,
                    Bitmap.Config.ARGB_8888
            );
            bitmap.copyPixelsFromBuffer(buffer);
            image.close();

            return Bitmap.createBitmap(bitmap, 0, 0, width, height);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
