package com.tm.riskalert.ocr;

public class RiskEvaluator {

    public static double calcKmRate(double valor, double distanciaKm) {
        return valor / distanciaKm;
    }

    public static double calcHrRate(double valor, double minutos) {
        return valor / (minutos / 60.0);
    }

    public static String avaliarMelhor(double kmRate, double hrRate) {
        return hrRate > kmRate * 20 ? "🏁 Melhor por hora" : "🚗 Melhor por km";
    }
}
