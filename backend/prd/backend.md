Below is a **strict, assignment-aligned Technical PRD**. No SaaS expansion, no extra features beyond the brief.

---

# 📘 TECHNICAL PRD — FuelEU Compliance Assignment

---

# 1. 🎯 Scope

Implement:

* **Frontend**: React + TypeScript + Tailwind
* **Backend**: Node.js + TypeScript + PostgreSQL
* **Architecture**: Hexagonal (Ports & Adapters)
* **Modules**:

  * Routes
  * Comparison
  * Compliance Balance (CB)
  * Banking (Article 20)
  * Pooling (Article 21)

---

# 2. 🧱 System Architecture

## Backend

```
src/
  core/
    domain/
    application/
    ports/
  adapters/
    inbound/http/
    outbound/postgres/
  infrastructure/
    db/
    server/
  shared/
```

## Frontend

```
src/
  core/
    domain/
    application/
    ports/
  adapters/
    ui/
    infrastructure/
  shared/
```

**Rules**

* Core = pure TS (no framework)
* Adapters = implement ports
* DB / Express only in adapters/infrastructure

---

# 3. 📊 Data Model

## Tables

### routes

* id (PK)
* route_id (string)
* vessel_type
* fuel_type
* year
* ghg_intensity
* fuel_consumption
* distance
* total_emissions
* is_baseline (boolean)

---

### ship_compliance

* id
* ship_id
* year
* cb_gco2eq

---

### bank_entries

* id
* ship_id
* year
* amount_gco2eq

---

### pools

* id
* year
* created_at

---

### pool_members

* pool_id
* ship_id
* cb_before
* cb_after

---

# 4. 🧮 Core Logic

## Constants

* Target = **89.3368 gCO₂e/MJ**

---

## Energy

```
energy = fuelConsumption * 41000
```

---

## Compliance Balance

```
CB = (target - ghgIntensity) * energy
```

* CB > 0 → surplus
* CB < 0 → deficit

---

## Comparison

```
percentDiff = ((comparison / baseline) - 1) * 100
```

```
compliant = comparison <= target
```

---

# 5. 🔗 Backend APIs

---

## Routes

### GET /routes

* Returns all routes

---

### POST /routes/:id/baseline

* Sets selected route as baseline
* Only one baseline per dataset

---

### GET /routes/comparison

Returns:

```
[
  {
    routeId,
    ghgIntensity,
    baselineGhgIntensity,
    percentDiff,
    compliant
  }
]
```

---

## Compliance

### GET /compliance/cb?shipId&year

Flow:

1. Fetch route data
2. Compute energy
3. Compute CB
4. Store in `ship_compliance`
5. Return CB

---

### GET /compliance/adjusted-cb?shipId&year

```
adjustedCB = CB + sum(banked_applied)
```

---

## Banking

### GET /banking/records?shipId&year

---

### POST /banking/bank

Input:

```
{ shipId, year, amount }
```

Rules:

* amount > 0
* CB must be positive
* amount ≤ CB

---

### POST /banking/apply

Input:

```
{ shipId, year, amount }
```

Rules:

* amount ≤ total banked
* ship must have deficit

---

## Pooling

### POST /pools

Input:

```
{
  year,
  members: [shipId]
}
```

---

### Pool Algorithm

1. Fetch CB for each ship
2. Validate:

   ```
   sum(CB) >= 0
   ```
3. Sort descending by CB
4. Greedy transfer:

   * Surplus → Deficit

---

### Constraints

* Deficit ship:

  ```
  cb_after >= cb_before
  ```
* Surplus ship:

  ```
  cb_after >= 0
  ```

---

### Response

```
[
  {
    shipId,
    cb_before,
    cb_after
  }
]
```

---

# 6. 🧩 Frontend Requirements

---

## Tabs

### 1. Routes

* Fetch: `/routes`

* Table columns:

  * routeId
  * vesselType
  * fuelType
  * year
  * ghgIntensity
  * fuelConsumption
  * distance
  * totalEmissions

* Filters:

  * vesselType
  * fuelType
  * year

* Action:

  * "Set Baseline" → POST API

---

### 2. Compare

* Fetch: `/routes/comparison`

Display:

* Table:

  * ghgIntensity
  * percentDiff
  * compliant

* Chart:

  * x-axis: routeId
  * y-axis: ghgIntensity

---

### 3. Banking

* Fetch CB: `/compliance/cb`
* Show:

  * cb_before
  * applied
  * cb_after

Actions:

* Bank → POST /banking/bank
* Apply → POST /banking/apply

Rules:

* Disable if CB ≤ 0
* Show API errors

---

### 4. Pooling

* Fetch: `/compliance/adjusted-cb`

UI:

* List ships
* Show:

  * cb_before
  * cb_after

Indicator:

* sum(CB) ≥ 0 → green
* else red

Action:

* Create Pool → POST /pools

Disable if invalid

---

# 7. 🧪 Testing

---

## Backend

### Unit Tests

* Compute CB
* Comparison logic
* Bank validation
* Apply bank logic
* Pool allocation

---

### Integration Tests

* All endpoints using Supertest

---

### Edge Cases

* Negative CB
* Over-banking
* Invalid pool (sum < 0)

---

## Frontend

* Component rendering
* API integration
* Form validation

---

# 8. 📊 Seed Data

Insert 5 routes exactly as given.

* One route must have:

```
is_baseline = true
```

---

# 9. 📄 Required Docs

---

## AGENT_WORKFLOW.md

* Prompts used
* Outputs
* Corrections
* Observations

---

## README.md

* Setup steps
* Architecture
* API usage
* Screenshots / responses

---

## REFLECTION.md

* Learnings
* AI efficiency
* Improvements

---

# 10. ✅ Acceptance Criteria

* All endpoints implemented correctly
* CB formula correct
* Banking + pooling rules enforced
* Frontend tabs functional
* Hexagonal architecture respected
* Tests runnable via:

```
npm run test
```

---

# 11. ⛔ Non-Goals

* No auth
* No multi-tenancy
* No external APIs
* No advanced analytics

---

This is exactly scoped to the assignment—nothing extra.
