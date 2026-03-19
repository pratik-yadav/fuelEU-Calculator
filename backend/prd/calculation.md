To build a backend system for FuelEU Compliance Balance (CB) calculations, you need a structured set of constants, variable definitions, and sequential formulas. Below is the data and logic framework for Heavy Fuel Oil (HFO) and Marine Diesel Oil (MDO), formatted for technical implementation.

### 1. Global Constants & Targets
These values are fixed by the regulation and should be stored as static configuration in your backend.

*   **GHG Intensity Target ($GHGIE_{target}$):** For the 2025–2029 reporting period, the limit is **89.33680 $gCO_2eq/MJ$**.
*   **Global Warming Potential (GWP100) Factors:**
    *   $GWP_{CO2} = 1$
    *   $GWP_{CH4} = 25$
    *   $GWP_{N2O} = 298$

### 2. Fuel-Specific Data (Fossil HFO & MDO)
These parameters are sourced from the default values in FuelEU Annex II.

| Parameter | Unit | HFO (RME to RMK) | MDO/MGO (DMX to DMB) |
| :--- | :--- | :--- | :--- |
| **LCV** (Lower Calorific Value) | $MJ/g$ | 0.0405 | 0.0427 |
| **WtT** (Well-to-Tank) | $gCO_2eq/MJ$ | 13.5 | 14.4 |
| **$C_fCO_2$** | $gCO_2/gFuel$ | 3.114 | 3.206 |
| **$C_fCH_4$** | $gCH_4/gFuel$ | 0.00005 | 0.00005 |
| **$C_fN_2O$** | $gN_2O/gFuel$ | 0.00018 | 0.00018 |
| **$C_{slip}$** (Methane Slip) | % | 0% | 0% |

### 3. Step-by-Step Calculation Logic

**Step 1: Calculate Mass in Scope ($M_i$)**
The mass of fuel used depends on the voyage geographic scope:
*   **Intra-EEA (EEA to EEA) or Port Stays:** 100% of fuel consumption is in scope.
*   **Extra-EEA (EEA to Non-EEA or vice versa):** Only 50% of fuel consumption is in scope.
*   **Formula:** $M_i [grams] = Total\ Tonnes \times 1,000,000 \times ScopeFactor$ ($1.0$ or $0.5$).

**Step 2: Calculate Total Energy Consumption ($E_{total}$)**
Convert the mass of each fuel into energy (Megajoules):
$$E_{total} [MJ] = \sum (M_i \times LCV_i)$$

**Step 3: Calculate Actual GHG Intensity per Fuel ($GHGIE_{actual, i}$)**
For HFO and MDO, the intensity is the sum of WtT and TtW.
1.  **WtT:** Sourced directly from the table (13.5 or 14.4).
2.  **TtW:** Calculated using the emission factors and GWPs:
    $$TtW_i = \frac{(C_fCO_2 \times GWP_{CO2}) + (C_fCH_4 \times GWP_{CH4}) + (C_fN_2O \times GWP_{N2O})}{LCV_i}$$
    *Note: For HFO, this results in **78.24420 $gCO_2eq/MJ$** and for MDO, **76.36745 $gCO_2eq/MJ$***.
3.  **Total Intensity ($GHGIE_{i}$):** $WtT_i + TtW_i$.

**Step 4: Calculate Weighted Average Intensity ($GHGIE_{actual}$)**
If multiple fuels are used, calculate the energy-weighted average:
$$GHGIE_{actual} = \frac{\sum (E_i \times GHGIE_i)}{E_{total}}$$

**Step 5: Compute Compliance Balance ($CB$)**
Calculate the final balance in grams of $CO_2$ equivalent:
$$CB [gCO_2eq] = (GHGIE_{target} - GHGIE_{actual}) \times E_{total}$$

### 4. Implementation Rules for Backend
*   **Rounding:** All intermediate values (intensities, energy) should be rounded to **five decimal places** to align with THETIS-MRV conventions.
*   **Output Interpretation:**
    *   **Positive CB:** Compliance surplus (can be banked or pooled).
    *   **Negative CB:** Compliance deficit (subject to a financial penalty).

Would you like me to create a **tailored report** summarizing these technical specifications, or perhaps a **slide deck** that explains this calculation flow for your development team?