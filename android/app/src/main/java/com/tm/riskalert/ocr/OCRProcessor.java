package com.tm.riskalert.ocr;

import android.graphics.Bitmap;
import android.util.Log;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions; // ✅ IMPORT CORRETO NO TOPO

public class OCRProcessor {

    public interface OCRCallback {
        void onResult(String text);
        void onError(Exception e);
    }

    public void process(Bitmap bitmap, OCRCallback callback) {
        try {
            InputImage image = InputImage.fromBitmap(bitmap, 0);
            TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);

            recognizer.process(image)
                    .addOnSuccessListener(result -> {
                        StringBuilder allText = new StringBuilder();
                        for (Text.TextBlock block : result.getTextBlocks()) {
                            allText.append(block.getText()).append("\n");
                        }
                        callback.onResult(allText.toString());
                    })
                    .addOnFailureListener(callback::onError);
        } catch (Exception e) {
            callback.onError(e);
        }
    }
}
