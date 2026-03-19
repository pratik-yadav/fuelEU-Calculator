## AI Agent Reflection

### What I Learned Using AI Agents

Working on this assignment highlighted how AI agents can be effectively integrated into a structured development workflow, especially for systems which requires strong architectural discipline like Hexagonal Architecture.

I learned that AI tools are most valuable when used as collaborators rather than generators. first, I extract knowledge and logic related to FuelEU (FuelEU formulas, CB logic) using NotebookLM and then translate that into a precise technical PRD using ChatGPT, I made sure the AI-generated code was based on correct domain understanding, which reduced errors and wrong logic implementation and kept the architecture consistent.

Clear input constraints lead to better outputs. Providing Claude with a clear product requirements document, adhering to strict architectural guidelines (separating core logic from adapters), and offering detailed, sequential instructions led to code that was both clean and modular, matching the original design.

I also observed that AI agents are particularly strong at:

* Generating boilerplate and repetitive structures
* Translating specifications into initial implementations
* Maintaining consistency across modules when guided properly

However, they still require active human validation, especially for:

* Business logic correctness
* Edge case handling
* Architectural integrity

---

### Efficiency Gains vs Manual Coding

Using AI agents significantly accelerated development:

* The time taken for Initial setup was reduced.
* Core module scaffolding (routes, services, repositories) was generated almost instantly.
* Frontend-backend integration became faster due to consistent API contracts derived from the PRD.
* Documentation (README, workflow logs) was efficiently drafted and refined.

Overall, the development speed improved by 2–3× compared to manual coding.
---

### Improvements for Future Iterations

If I do this again, I would improve the process like this:

1. **Give Smaller Instructions**

   * Ask AI to do one small task at a time
   * Avoid asking for big features in one go
   * This will give better and more correct code

2. **Check Edge Cases During Development**

   * Think about edge cases while building each feature
   * Example: negative CB, invalid pooling
   * This avoids bugs later

3. **Review in Small Steps**

   * Do not accept large changes at once
   * Check and approve small parts step by step
   * This keeps code clean and easy to track

4. **Define Types Clearly**

   * Create proper TypeScript types at the beginning
   * Use them everywhere in backend and frontend
   * This avoids mismatch and errors

5. **More Clearly Defining the PRD**
   * Maintaining the Changelog file after the implemention of each feature
   * Make reviewer agent for reviewing the code in secuiritywise, architecturewise and domainwise


### Conclusion

AI agents enhanced productivity and reduced development time significantly, but their effectiveness depended heavily on:

* Quality of initial inputs (PRD, domain understanding)
* Continuous validation
* Controlled, iterative usage
