package com.tm.riskalert.ocr.utils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RiskUtils {

    // Extrai o primeiro número decimal (ex: R$ 6,39 ou 5.2 km)
    public static double extrairNumero(String texto) {
        try {
            Pattern pattern = Pattern.compile("(\\d+[\\.,]?\\d*)");
            Matcher matcher = pattern.matcher(texto.replace(",", "."));
            if (matcher.find()) {
                return Double.parseDouble(matcher.group(1));
            }
        } catch (Exception e) {
            // Ignorar
        }
        return 0.0;
    }

    // Extrai minutos de um texto como "9 minutos"
    public static double extrairMinutos(String texto) {
        try {
            Pattern pattern = Pattern.compile("(\\d+)\\s*min");
            Matcher matcher = pattern.matcher(texto);
            if (matcher.find()) {
                return Double.parseDouble(matcher.group(1));
            }
        } catch (Exception e) {
            // Ignorar
        }
        return 0.0;
    }

    // Extrai distância de um texto como "5.4 km"
    public static double extrairKm(String texto) {
        try {
            Pattern pattern = Pattern.compile("(\\d+[\\.,]?\\d*)\\s*km");
            Matcher matcher = pattern.matcher(texto.replace(",", "."));
            if (matcher.find()) {
                return Double.parseDouble(matcher.group(1));
            }
        } catch (Exception e) {
            // Ignorar
        }
        return 0.0;
    }

    // Extrai uma linha que contenha endereço, bairro ou CEP
    public static String extrairCepOuBairro(String texto) {
        String[] linhas = texto.split("\n");
        for (String linha : linhas) {
            if (linha.matches(".*\\d{5}-\\d{3}.*")) return linha.trim(); // CEP
            if (linha.toLowerCase().contains("nova iguaçu") || linha.toLowerCase().contains("austin")) return linha.trim(); // bairros
        }
        return "Local não identificado";
    }
}
