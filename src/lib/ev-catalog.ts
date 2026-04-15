// EV model catalog with predefined specs
// connector_type: "type2" = AC, "ccs" = DC/CCS2, "chademo" = CHAdeMO, "tesla_ccs" = Tesla CCS

export interface EVModel {
  brand: string;
  model: string;
  battery_kwh: number;
  max_charge_kw: number;
  connector_type: "type2" | "ccs" | "chademo" | "tesla_ccs";
  range_km?: number;
}

// Brand → Model list
export const EV_CATALOG: Record<string, EVModel[]> = {
  Tesla: [
    { brand: "Tesla", model: "Model 3 Standard Range", battery_kwh: 60, max_charge_kw: 170, connector_type: "ccs", range_km: 438 },
    { brand: "Tesla", model: "Model 3 Long Range", battery_kwh: 82, max_charge_kw: 250, connector_type: "ccs", range_km: 629 },
    { brand: "Tesla", model: "Model 3 Performance", battery_kwh: 82, max_charge_kw: 250, connector_type: "ccs", range_km: 547 },
    { brand: "Tesla", model: "Model Y Standard Range", battery_kwh: 60, max_charge_kw: 170, connector_type: "ccs", range_km: 390 },
    { brand: "Tesla", model: "Model Y Long Range", battery_kwh: 82, max_charge_kw: 250, connector_type: "ccs", range_km: 533 },
    { brand: "Tesla", model: "Model Y Performance", battery_kwh: 82, max_charge_kw: 250, connector_type: "ccs", range_km: 514 },
    { brand: "Tesla", model: "Model S Long Range", battery_kwh: 100, max_charge_kw: 250, connector_type: "ccs", range_km: 652 },
    { brand: "Tesla", model: "Model S Plaid", battery_kwh: 100, max_charge_kw: 250, connector_type: "ccs", range_km: 600 },
    { brand: "Tesla", model: "Model X Long Range", battery_kwh: 100, max_charge_kw: 250, connector_type: "ccs", range_km: 580 },
    { brand: "Tesla", model: "Cybertruck AWD", battery_kwh: 123, max_charge_kw: 250, connector_type: "tesla_ccs", range_km: 547 },
  ],
  Volkswagen: [
    { brand: "Volkswagen", model: "ID.3 Pure", battery_kwh: 45, max_charge_kw: 100, connector_type: "ccs", range_km: 350 },
    { brand: "Volkswagen", model: "ID.3 Pro", battery_kwh: 58, max_charge_kw: 100, connector_type: "ccs", range_km: 427 },
    { brand: "Volkswagen", model: "ID.3 Pro S", battery_kwh: 77, max_charge_kw: 135, connector_type: "ccs", range_km: 549 },
    { brand: "Volkswagen", model: "ID.4 Pro", battery_kwh: 77, max_charge_kw: 135, connector_type: "ccs", range_km: 521 },
    { brand: "Volkswagen", model: "ID.4 GTX", battery_kwh: 77, max_charge_kw: 135, connector_type: "ccs", range_km: 480 },
    { brand: "Volkswagen", model: "ID.5 Pro", battery_kwh: 77, max_charge_kw: 135, connector_type: "ccs", range_km: 519 },
    { brand: "Volkswagen", model: "ID.7 Pro", battery_kwh: 77, max_charge_kw: 175, connector_type: "ccs", range_km: 621 },
    { brand: "Volkswagen", model: "e-Golf", battery_kwh: 35.8, max_charge_kw: 40, connector_type: "ccs", range_km: 231 },
    { brand: "Volkswagen", model: "e-UP!", battery_kwh: 32.3, max_charge_kw: 40, connector_type: "ccs", range_km: 260 },
  ],
  BMW: [
    { brand: "BMW", model: "i3 (120 Ah)", battery_kwh: 42.2, max_charge_kw: 50, connector_type: "ccs", range_km: 285 },
    { brand: "BMW", model: "i4 eDrive35", battery_kwh: 70.2, max_charge_kw: 195, connector_type: "ccs", range_km: 483 },
    { brand: "BMW", model: "i4 eDrive40", battery_kwh: 83.9, max_charge_kw: 200, connector_type: "ccs", range_km: 590 },
    { brand: "BMW", model: "i4 M50", battery_kwh: 83.9, max_charge_kw: 205, connector_type: "ccs", range_km: 510 },
    { brand: "BMW", model: "iX1 xDrive30", battery_kwh: 64.7, max_charge_kw: 130, connector_type: "ccs", range_km: 440 },
    { brand: "BMW", model: "iX3", battery_kwh: 80, max_charge_kw: 150, connector_type: "ccs", range_km: 461 },
    { brand: "BMW", model: "iX xDrive40", battery_kwh: 76.6, max_charge_kw: 200, connector_type: "ccs", range_km: 425 },
    { brand: "BMW", model: "iX xDrive50", battery_kwh: 111.5, max_charge_kw: 200, connector_type: "ccs", range_km: 630 },
    { brand: "BMW", model: "i5 eDrive40", battery_kwh: 84, max_charge_kw: 205, connector_type: "ccs", range_km: 577 },
    { brand: "BMW", model: "i7 xDrive60", battery_kwh: 101.7, max_charge_kw: 195, connector_type: "ccs", range_km: 625 },
  ],
  Mercedes: [
    { brand: "Mercedes", model: "EQA 250", battery_kwh: 66.5, max_charge_kw: 100, connector_type: "ccs", range_km: 429 },
    { brand: "Mercedes", model: "EQB 300 4MATIC", battery_kwh: 66.5, max_charge_kw: 100, connector_type: "ccs", range_km: 419 },
    { brand: "Mercedes", model: "EQC 400", battery_kwh: 80, max_charge_kw: 110, connector_type: "ccs", range_km: 411 },
    { brand: "Mercedes", model: "EQE 350", battery_kwh: 90.6, max_charge_kw: 170, connector_type: "ccs", range_km: 654 },
    { brand: "Mercedes", model: "EQS 450+", battery_kwh: 107.8, max_charge_kw: 200, connector_type: "ccs", range_km: 784 },
    { brand: "Mercedes", model: "EQS 580 4MATIC", battery_kwh: 107.8, max_charge_kw: 200, connector_type: "ccs", range_km: 676 },
    { brand: "Mercedes", model: "G 580 EQ", battery_kwh: 116, max_charge_kw: 200, connector_type: "ccs", range_km: 473 },
  ],
  Audi: [
    { brand: "Audi", model: "Q4 e-tron 40", battery_kwh: 76.6, max_charge_kw: 130, connector_type: "ccs", range_km: 520 },
    { brand: "Audi", model: "Q4 e-tron 50 quattro", battery_kwh: 76.6, max_charge_kw: 175, connector_type: "ccs", range_km: 490 },
    { brand: "Audi", model: "Q6 e-tron", battery_kwh: 100, max_charge_kw: 270, connector_type: "ccs", range_km: 641 },
    { brand: "Audi", model: "e-tron 55 quattro", battery_kwh: 95, max_charge_kw: 150, connector_type: "ccs", range_km: 417 },
    { brand: "Audi", model: "e-tron GT quattro", battery_kwh: 93.4, max_charge_kw: 270, connector_type: "ccs", range_km: 488 },
    { brand: "Audi", model: "RS e-tron GT", battery_kwh: 93.4, max_charge_kw: 270, connector_type: "ccs", range_km: 472 },
    { brand: "Audi", model: "A6 e-tron", battery_kwh: 100, max_charge_kw: 270, connector_type: "ccs", range_km: 756 },
  ],
  Porsche: [
    { brand: "Porsche", model: "Taycan", battery_kwh: 93.4, max_charge_kw: 270, connector_type: "ccs", range_km: 431 },
    { brand: "Porsche", model: "Taycan 4S", battery_kwh: 93.4, max_charge_kw: 270, connector_type: "ccs", range_km: 463 },
    { brand: "Porsche", model: "Taycan Turbo", battery_kwh: 93.4, max_charge_kw: 270, connector_type: "ccs", range_km: 450 },
    { brand: "Porsche", model: "Taycan Turbo S", battery_kwh: 93.4, max_charge_kw: 270, connector_type: "ccs", range_km: 411 },
    { brand: "Porsche", model: "Taycan Cross Turismo", battery_kwh: 93.4, max_charge_kw: 270, connector_type: "ccs", range_km: 456 },
    { brand: "Porsche", model: "Macan EV", battery_kwh: 100, max_charge_kw: 270, connector_type: "ccs", range_km: 613 },
  ],
  Hyundai: [
    { brand: "Hyundai", model: "IONIQ 5 Standard Range", battery_kwh: 58, max_charge_kw: 220, connector_type: "ccs", range_km: 384 },
    { brand: "Hyundai", model: "IONIQ 5 Long Range RWD", battery_kwh: 77.4, max_charge_kw: 220, connector_type: "ccs", range_km: 507 },
    { brand: "Hyundai", model: "IONIQ 5 Long Range AWD", battery_kwh: 77.4, max_charge_kw: 220, connector_type: "ccs", range_km: 454 },
    { brand: "Hyundai", model: "IONIQ 6 Long Range RWD", battery_kwh: 77.4, max_charge_kw: 220, connector_type: "ccs", range_km: 614 },
    { brand: "Hyundai", model: "IONIQ 6 Long Range AWD", battery_kwh: 77.4, max_charge_kw: 220, connector_type: "ccs", range_km: 583 },
    { brand: "Hyundai", model: "Kona Electric 64 kWh", battery_kwh: 64.8, max_charge_kw: 100, connector_type: "ccs", range_km: 484 },
  ],
  Kia: [
    { brand: "Kia", model: "EV6 Standard Range", battery_kwh: 58, max_charge_kw: 220, connector_type: "ccs", range_km: 394 },
    { brand: "Kia", model: "EV6 Long Range RWD", battery_kwh: 77.4, max_charge_kw: 220, connector_type: "ccs", range_km: 528 },
    { brand: "Kia", model: "EV6 Long Range AWD", battery_kwh: 77.4, max_charge_kw: 220, connector_type: "ccs", range_km: 484 },
    { brand: "Kia", model: "EV6 GT", battery_kwh: 77.4, max_charge_kw: 240, connector_type: "ccs", range_km: 424 },
    { brand: "Kia", model: "EV9 Long Range RWD", battery_kwh: 99.8, max_charge_kw: 240, connector_type: "ccs", range_km: 563 },
    { brand: "Kia", model: "Niro EV", battery_kwh: 64.8, max_charge_kw: 100, connector_type: "ccs", range_km: 463 },
  ],
  Peugeot: [
    { brand: "Peugeot", model: "e-208", battery_kwh: 50, max_charge_kw: 100, connector_type: "ccs", range_km: 362 },
    { brand: "Peugeot", model: "e-2008", battery_kwh: 50, max_charge_kw: 100, connector_type: "ccs", range_km: 322 },
    { brand: "Peugeot", model: "e-308", battery_kwh: 54, max_charge_kw: 100, connector_type: "ccs", range_km: 410 },
    { brand: "Peugeot", model: "e-408", battery_kwh: 54, max_charge_kw: 100, connector_type: "ccs", range_km: 400 },
  ],
  Renault: [
    { brand: "Renault", model: "Zoe R135", battery_kwh: 52, max_charge_kw: 50, connector_type: "type2", range_km: 395 },
    { brand: "Renault", model: "Megane E-Tech EV40", battery_kwh: 40, max_charge_kw: 85, connector_type: "ccs", range_km: 300 },
    { brand: "Renault", model: "Megane E-Tech EV60", battery_kwh: 60, max_charge_kw: 130, connector_type: "ccs", range_km: 470 },
    { brand: "Renault", model: "Scenic E-Tech", battery_kwh: 87, max_charge_kw: 150, connector_type: "ccs", range_km: 620 },
    { brand: "Renault", model: "5 E-Tech", battery_kwh: 52, max_charge_kw: 100, connector_type: "ccs", range_km: 410 },
  ],
  MINI: [
    { brand: "MINI", model: "Cooper SE", battery_kwh: 28.9, max_charge_kw: 49, connector_type: "ccs", range_km: 234 },
    { brand: "MINI", model: "Countryman SE ALL4", battery_kwh: 64.7, max_charge_kw: 130, connector_type: "ccs", range_km: 433 },
    { brand: "MINI", model: "Aceman SE", battery_kwh: 42.5, max_charge_kw: 75, connector_type: "ccs", range_km: 310 },
    { brand: "MINI", model: "Aceman E", battery_kwh: 54.2, max_charge_kw: 95, connector_type: "ccs", range_km: 406 },
  ],
  Volvo: [
    { brand: "Volvo", model: "XC40 Recharge", battery_kwh: 82, max_charge_kw: 150, connector_type: "ccs", range_km: 425 },
    { brand: "Volvo", model: "C40 Recharge", battery_kwh: 82, max_charge_kw: 150, connector_type: "ccs", range_km: 476 },
    { brand: "Volvo", model: "EX30 Extended Range", battery_kwh: 69, max_charge_kw: 153, connector_type: "ccs", range_km: 476 },
    { brand: "Volvo", model: "EX40 Pure Electric", battery_kwh: 82, max_charge_kw: 150, connector_type: "ccs", range_km: 537 },
    { brand: "Volvo", model: "EX90 Twin Motor", battery_kwh: 111, max_charge_kw: 250, connector_type: "ccs", range_km: 580 },
  ],
  Skoda: [
    { brand: "Skoda", model: "Enyaq 60", battery_kwh: 58, max_charge_kw: 100, connector_type: "ccs", range_km: 415 },
    { brand: "Skoda", model: "Enyaq 85", battery_kwh: 77, max_charge_kw: 135, connector_type: "ccs", range_km: 556 },
    { brand: "Skoda", model: "Enyaq 85x", battery_kwh: 77, max_charge_kw: 135, connector_type: "ccs", range_km: 524 },
    { brand: "Skoda", model: "Elroq 60", battery_kwh: 59, max_charge_kw: 145, connector_type: "ccs", range_km: 408 },
    { brand: "Skoda", model: "Elroq 85", battery_kwh: 77, max_charge_kw: 175, connector_type: "ccs", range_km: 560 },
  ],
  Nissan: [
    { brand: "Nissan", model: "Leaf 40 kWh", battery_kwh: 40, max_charge_kw: 50, connector_type: "chademo", range_km: 270 },
    { brand: "Nissan", model: "Leaf e+ 62 kWh", battery_kwh: 62, max_charge_kw: 100, connector_type: "chademo", range_km: 385 },
    { brand: "Nissan", model: "Ariya 63 kWh", battery_kwh: 63, max_charge_kw: 130, connector_type: "ccs", range_km: 403 },
    { brand: "Nissan", model: "Ariya 87 kWh e-4ORCE", battery_kwh: 87, max_charge_kw: 130, connector_type: "ccs", range_km: 498 },
  ],
  Opel: [
    { brand: "Opel", model: "Corsa Electric", battery_kwh: 50, max_charge_kw: 100, connector_type: "ccs", range_km: 357 },
    { brand: "Opel", model: "Mokka Electric", battery_kwh: 50, max_charge_kw: 100, connector_type: "ccs", range_km: 322 },
    { brand: "Opel", model: "Astra Electric", battery_kwh: 54, max_charge_kw: 100, connector_type: "ccs", range_km: 418 },
    { brand: "Opel", model: "Grandland Electric", battery_kwh: 82, max_charge_kw: 160, connector_type: "ccs", range_km: 525 },
  ],
  "Sonstige": [
    { brand: "Sonstige", model: "Benutzerdefiniert", battery_kwh: 60, max_charge_kw: 50, connector_type: "ccs" },
  ],
};

export const EV_BRANDS = Object.keys(EV_CATALOG).sort((a, b) =>
  a === "Sonstige" ? 1 : b === "Sonstige" ? -1 : a.localeCompare(b)
);
