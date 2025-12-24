package com.spooltracker.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import com.spooltracker.dto.FilamentUsageDTO;

import jakarta.enterprise.context.ApplicationScoped;

/**
 * Service for parsing 3MF files to extract filament usage information
 */
@ApplicationScoped
public class ThreeMFParserService {

    /**
     * Parse result containing all extracted data from a 3MF file
     */
    public record ParseResult(
        String printerModel,
        int estimatedTimeSeconds,
        double totalWeightGrams,
        boolean usesSupport,
        List<FilamentUsageDTO> filaments
    ) {}

    /**
     * Parse a 3MF file and extract filament usage data
     * @param inputStream The 3MF file input stream
     * @return ParseResult containing extracted data
     */
    public ParseResult parse(InputStream inputStream) throws Exception {
        // 3MF files are ZIP archives
        try (ZipInputStream zipIn = new ZipInputStream(inputStream)) {
            ZipEntry entry;
            while ((entry = zipIn.getNextEntry()) != null) {
                if (entry.getName().equals("Metadata/slice_info.config")) {
                    return parseSliceInfo(zipIn);
                }
            }
        }
        throw new IllegalArgumentException("No slice_info.config found in 3MF file. Make sure the file has been sliced.");
    }

    private ParseResult parseSliceInfo(InputStream inputStream) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        // Disable external entities for security
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(inputStream);

        Element root = doc.getDocumentElement();
        NodeList plateNodes = root.getElementsByTagName("plate");
        
        if (plateNodes.getLength() == 0) {
            throw new IllegalArgumentException("No plate data found in slice_info.config");
        }

        Element plate = (Element) plateNodes.item(0);
        
        // Extract metadata
        String printerModel = getMetadataValue(plate, "printer_model_id", "Unknown");
        int estimatedTime = Integer.parseInt(getMetadataValue(plate, "prediction", "0"));
        double totalWeight = Double.parseDouble(getMetadataValue(plate, "weight", "0"));
        boolean usesSupport = Boolean.parseBoolean(getMetadataValue(plate, "support_used", "false"));

        // Extract filament usage
        List<FilamentUsageDTO> filaments = new ArrayList<>();
        NodeList filamentNodes = plate.getElementsByTagName("filament");
        
        for (int i = 0; i < filamentNodes.getLength(); i++) {
            Element filament = (Element) filamentNodes.item(i);
            
            int id = Integer.parseInt(filament.getAttribute("id"));
            String type = filament.getAttribute("type");
            String color = filament.getAttribute("color").toUpperCase();
            double usedMeters = Double.parseDouble(filament.getAttribute("used_m"));
            double usedGrams = Double.parseDouble(filament.getAttribute("used_g"));
            String nozzleDiameter = filament.getAttribute("nozzle_diameter");

            filaments.add(new FilamentUsageDTO(id, type, color, usedMeters, usedGrams, nozzleDiameter));
        }

        return new ParseResult(printerModel, estimatedTime, totalWeight, usesSupport, filaments);
    }

    private String getMetadataValue(Element plate, String key, String defaultValue) {
        NodeList metadataNodes = plate.getElementsByTagName("metadata");
        for (int i = 0; i < metadataNodes.getLength(); i++) {
            Element metadata = (Element) metadataNodes.item(i);
            if (key.equals(metadata.getAttribute("key"))) {
                return metadata.getAttribute("value");
            }
        }
        return defaultValue;
    }
}

