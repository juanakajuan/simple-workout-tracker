import { describe, expect, it } from "vitest";

import { DEFAULT_EXERCISES } from "./defaultExercises";
import { absExercises } from "./exercises/abs";
import { backExercises } from "./exercises/back";
import { bicepsExercises } from "./exercises/biceps";
import { calvesExercises } from "./exercises/calves";
import { chestExercises } from "./exercises/chest";
import { forearmsExercises } from "./exercises/forearms";
import { glutesExercises } from "./exercises/glutes";
import { hamstringsExercises } from "./exercises/hamstrings";
import { quadsExercises } from "./exercises/quads";
import { shouldersExercises } from "./exercises/shoulders";
import { trapsExercises } from "./exercises/traps";
import { tricepsExercises } from "./exercises/triceps";

describe("DEFAULT_EXERCISES", () => {
  it("concatenates every built-in exercise list in the published order", () => {
    expect(DEFAULT_EXERCISES).toEqual([
      ...chestExercises,
      ...tricepsExercises,
      ...shouldersExercises,
      ...backExercises,
      ...bicepsExercises,
      ...quadsExercises,
      ...hamstringsExercises,
      ...glutesExercises,
      ...calvesExercises,
      ...trapsExercises,
      ...forearmsExercises,
      ...absExercises,
    ]);
  });

  it("matches the combined total from every built-in exercise list", () => {
    expect(DEFAULT_EXERCISES).toHaveLength(
      chestExercises.length +
        tricepsExercises.length +
        shouldersExercises.length +
        backExercises.length +
        bicepsExercises.length +
        quadsExercises.length +
        hamstringsExercises.length +
        glutesExercises.length +
        calvesExercises.length +
        trapsExercises.length +
        forearmsExercises.length +
        absExercises.length
    );
  });
});
