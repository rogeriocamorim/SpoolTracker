-- Manufacturers
INSERT INTO manufacturer (id, name, description, website) VALUES (1, 'Bambu Lab', 'High-quality 3D printing filaments designed for Bambu Lab printers', 'https://bambulab.com');
INSERT INTO manufacturer (id, name, description, website) VALUES (2, 'Polymaker', 'Premium 3D printing materials for professionals and enthusiasts', 'https://polymaker.com');
INSERT INTO manufacturer (id, name, description, website) VALUES (3, 'Hatchbox', 'Reliable and affordable 3D printing filaments', 'https://hatchbox3d.com');
INSERT INTO manufacturer (id, name, description, website) VALUES (4, 'eSUN', 'Wide variety of 3D printing materials', 'https://esun3d.com');
INSERT INTO manufacturer (id, name, description, website) VALUES (5, 'Prusament', 'Precision-made filaments by Prusa Research', 'https://prusament.com');

-- Materials
INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (1, 'PLA', 'Polylactic Acid - Easy to print, biodegradable', 190, 230, 45, 60, false, false);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (2, 'PETG', 'Polyethylene Terephthalate Glycol - Strong and flexible', 220, 250, 70, 85, false, true);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (3, 'ASA/ABS', 'Acrylonitrile Styrene Acrylate / Acrylonitrile Butadiene Styrene - UV resistant, durable', 240, 270, 90, 110, true, true);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (4, 'TPU', 'Thermoplastic Polyurethane - Flexible and elastic', 210, 240, 40, 60, false, true);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (5, 'PC', 'Polycarbonate - High strength and temperature resistance', 260, 300, 100, 120, true, true);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (6, 'PA/PET', 'Polyamide/Nylon - Strong and wear resistant', 250, 280, 70, 90, true, true);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (7, 'PPS', 'Polyphenylene Sulfide - High temperature and chemical resistance', 290, 330, 120, 150, true, true);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (8, 'Support', 'Support materials for multi-material printing', 190, 230, 45, 60, false, false);

INSERT INTO material (id, name, description, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp, requires_enclosure, requires_dry_box) 
VALUES (9, 'Fiber Reinforced', 'Carbon fiber or glass fiber reinforced materials', 240, 280, 80, 100, true, true);

-- Filament Types for Bambu Lab

-- PLA Basic (id=1)
INSERT INTO filament_type (id, name, description, material_id, manufacturer_id, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp) 
VALUES (1, 'PLA Basic', 'Bambu Lab standard PLA filament', 1, 1, 190, 220, 45, 55);

-- PLA Matte (id=2)
INSERT INTO filament_type (id, name, description, material_id, manufacturer_id, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp) 
VALUES (2, 'PLA Matte', 'Bambu Lab matte finish PLA filament', 1, 1, 190, 220, 45, 55);

-- PETG High Flow (id=3)
INSERT INTO filament_type (id, name, description, material_id, manufacturer_id, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp) 
VALUES (3, 'PETG HF', 'Bambu Lab high flow PETG filament', 2, 1, 230, 250, 70, 80);

-- PETG Translucent (id=4)
INSERT INTO filament_type (id, name, description, material_id, manufacturer_id, min_nozzle_temp, max_nozzle_temp, min_bed_temp, max_bed_temp) 
VALUES (4, 'PETG Translucent', 'Bambu Lab translucent PETG filament', 2, 1, 230, 250, 70, 80);

-- PLA Basic Colors with Bambu Lab product codes
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (1, 'Jade White', '#FFFFFF', '10100', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (2, 'Magenta', '#EC008C', '10101', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (3, 'Gold', '#E4BD68', '10102', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (4, 'Mistletoe Green', '#3F8E43', '10103', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (5, 'Red', '#C12E1F', '10104', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (6, 'Purple', '#5E43B7', '10105', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (7, 'Beige', '#F7E6DE', '10106', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (8, 'Pink', '#F55A74', '10107', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (9, 'Sunflower Yellow', '#FEC600', '10108', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (10, 'Bronze', '#847D48', '10109', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (11, 'Turquoise', '#00B1B7', '10110', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (12, 'Indigo Purple', '#482960', '10111', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (13, 'Light Gray', '#D1D3D5', '10112', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (14, 'Hot Pink', '#F5547C', '10113', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (15, 'Yellow', '#F4EE2A', '10114', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (16, 'Cocoa Brown', '#6F5034', '10115', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (17, 'Cyan', '#0086D6', '10116', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (18, 'Blue Grey', '#5B6579', '10117', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (19, 'Silver', '#A6A9AA', '10118', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (20, 'Orange', '#FF6A13', '10119', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (21, 'Bright Green', '#BECF00', '10120', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (22, 'Brown', '#9D432C', '10121', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (23, 'Blue', '#0A2989', '10122', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (24, 'Dark Gray', '#545454', '10123', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (25, 'Gray', '#8E9089', '10124', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (26, 'Pumpkin Orange', '#FF9016', '10125', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (27, 'Bambu Green', '#00AE42', '10126', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (28, 'Maroon Red', '#9D2235', '10127', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (29, 'Cobalt Blue', '#0056B8', '10128', 1);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (30, 'Black', '#000000', '10129', 1);

-- PLA Matte Colors with Bambu Lab product codes
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (31, 'Ivory White', '#FFFFFF', '10200', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (32, 'Bone White', '#CBC6B8', '10201', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (33, 'Desert Tan', '#E8DBB7', '10202', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (34, 'Latte Brown', '#D3B7A7', '10203', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (35, 'Caramel', '#AE835B', '10204', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (36, 'Terracotta', '#B15533', '10205', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (37, 'Dark Brown', '#7D6556', '10206', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (38, 'Dark Chocolate', '#4D3324', '10207', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (39, 'Lilac Purple', '#AE96D4', '10208', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (40, 'Sakura Pink', '#E8AFCF', '10209', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (41, 'Mandarin Orange', '#F99963', '10210', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (42, 'Lemon Yellow', '#F7D959', '10211', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (43, 'Plum', '#950051', '10212', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (44, 'Scarlet Red', '#DE4343', '10213', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (45, 'Dark Red', '#BB3D43', '10214', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (46, 'Dark Green', '#68724D', '10215', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (47, 'Grass Green', '#61C680', '10216', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (48, 'Apple Green', '#C2E189', '10217', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (49, 'Ice Blue', '#A3D8E1', '10218', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (50, 'Sky Blue', '#56B7E6', '10219', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (51, 'Marine Blue', '#0078BF', '10220', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (52, 'Dark Blue', '#042F56', '10221', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (53, 'Ash Gray', '#9B9EA0', '10222', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (54, 'Nardo Gray', '#757575', '10223', 2);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (55, 'Charcoal', '#000000', '10224', 2);

-- PETG High Flow Colors with Bambu Lab product codes
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (56, 'Yellow', '#FFD00B', '33100', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (57, 'Orange', '#F75403', '33101', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (58, 'Green', '#00AE42', '33102', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (59, 'Red', '#EB3A3A', '33103', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (60, 'Blue', '#002E96', '33104', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (61, 'Black', '#000000', '33105', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (62, 'White', '#FFFFFF', '33106', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (63, 'Cream', '#F9DFB9', '33107', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (64, 'Lime Green', '#6EE53C', '33108', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (65, 'Forest Green', '#39541A', '33109', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (66, 'Lake Blue', '#1F79E5', '33110', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (67, 'Peanut Brown', '#875718', '33111', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (68, 'Gray', '#ADB1B2', '33112', 3);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (69, 'Dark Gray', '#515151', '33113', 3);

-- PETG Translucent Colors with Bambu Lab product codes
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (70, 'Translucent Gray', '#8E8E8E', '33200', 4);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (71, 'Translucent Light Blue', '#61B0FF', '33201', 4);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (72, 'Translucent Olive', '#748C45', '33202', 4);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (73, 'Translucent Brown', '#C9A381', '33203', 4);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (74, 'Translucent Teal', '#77EDD7', '33204', 4);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (75, 'Translucent Orange', '#FF911A', '33205', 4);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (76, 'Translucent Purple', '#D6ABFF', '33206', 4);
INSERT INTO filament_color (id, name, hex_code, product_code, filament_type_id) VALUES (77, 'Translucent Pink', '#F9C1BD', '33207', 4);

-- Default Locations
-- AMS Units
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (1, 'AMS 1', 'Primary AMS Unit', 'AMS', NULL, 4, '#00AE42', 1, true);
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (2, 'Slot 1', 'AMS 1 - Slot 1', 'AMS', 1, 1, '#00AE42', 1, true);
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (3, 'Slot 2', 'AMS 1 - Slot 2', 'AMS', 1, 1, '#00AE42', 2, true);
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (4, 'Slot 3', 'AMS 1 - Slot 3', 'AMS', 1, 1, '#00AE42', 3, true);
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (5, 'Slot 4', 'AMS 1 - Slot 4', 'AMS', 1, 1, '#00AE42', 4, true);

-- Storage Rack
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (6, 'Storage Rack A', 'Main storage rack', 'RACK', NULL, NULL, '#0056B8', 2, true);
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (7, 'Shelf 1', 'Top shelf', 'SHELF', 6, 10, '#0056B8', 1, true);
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (8, 'Shelf 2', 'Middle shelf', 'SHELF', 6, 10, '#0056B8', 2, true);
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (9, 'Shelf 3', 'Bottom shelf', 'SHELF', 6, 10, '#0056B8', 3, true);

-- Dry Box Storage
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (10, 'Dry Box', 'Humidity controlled storage', 'STORAGE', NULL, 8, '#FF6A13', 3, true);

-- Printer
INSERT INTO location (id, name, description, location_type, parent_id, capacity, color, sort_order, is_active) VALUES (11, 'Printer', 'Currently loaded in printer (external spool)', 'PRINTER', NULL, 1, '#9D2235', 4, true);

