import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Edit3,
  MoreVertical,
  Plus,
  SkipForward,
  StickyNote,
  Trash2,
} from "lucide-react";

import type { Exercise, IntensityTechnique, WorkoutExercise, WorkoutSet } from "../../types";
import {
  INTENSITY_TECHNIQUES,
  exerciseTypeLabels,
  intensityTechniqueLabels,
  muscleGroupLabels,
} from "../../types";
import { SetRow } from "../../components/SetRow";
import { Tag } from "../../components/Tag";
import { getSupersetPartnerId } from "../../utils/intensityTechniques";
import {
  STANDARD_BARBELL_WEIGHT,
  canUsePlateCalculator,
  formatWeight,
  getPlateCalculatorTarget,
  getPlateCalculatorTitle,
  getPlateLayout,
} from "../../utils/workoutUtils";
import type { LastPerformedSet } from "./workoutPageHelpers";
import { getWorkoutTechniqueLabel } from "./workoutPageHelpers";

interface WorkoutExerciseCardProps {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  allWorkoutExercises: WorkoutExercise[];
  exerciseLookup: ReadonlyMap<string, Exercise>;
  exerciseIndex: number;
  totalExerciseCount: number;
  lastPerformedSets?: LastPerformedSet[] | null;
  supersetDisplayLabels: Record<string, string>;
  isKebabMenuOpen: boolean;
  isIntensityEditorOpen: boolean;
  isPlateCalculatorOpen: boolean;
  isNoteEditorOpen: boolean;
  selectedPlateCalculatorSetId?: string;
  onViewHistory: () => void;
  onToggleKebabMenu: () => void;
  onToggleIntensityEditor: () => void;
  onTogglePlateCalculator: (defaultSetId?: string) => void;
  onSelectPlateCalculatorSet: (setId: string) => void;
  onStartEditingNote: () => void;
  onStopEditingNote: () => void;
  onChangeNote: (noteText: string) => void;
  onDeleteNote: () => void;
  onSkipRemainingSets: () => void;
  onMoveExercise: (direction: "up" | "down") => void;
  onReplaceExercise: () => void;
  onDeleteExercise: () => void;
  onSetIntensityTechnique: (intensityTechnique: IntensityTechnique | null) => void;
  onSetSupersetPartner: (partnerWorkoutExerciseId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (setId: string) => void;
  onAddSet: () => void;
}

interface WorkoutPlateCalculatorPanelProps {
  workoutExerciseId: string;
  exerciseName: string;
  exerciseType: Exercise["exerciseType"];
  workoutExercise: WorkoutExercise;
  selectedPlateCalculatorSetId?: string;
  onSelectPlateCalculatorSet: (setId: string) => void;
}

/**
 * Renders the plate calculator state for a workout exercise.
 * Keeps the large conditional UI out of the page component.
 */
function WorkoutPlateCalculatorPanel({
  workoutExerciseId,
  exerciseName,
  exerciseType,
  workoutExercise,
  selectedPlateCalculatorSetId,
  onSelectPlateCalculatorSet,
}: WorkoutPlateCalculatorPanelProps): React.ReactElement {
  const plateCalculatorTarget = getPlateCalculatorTarget(
    workoutExercise,
    selectedPlateCalculatorSetId
  );
  const plateLayout = plateCalculatorTarget
    ? getPlateLayout(plateCalculatorTarget.set.weight)
    : null;

  return (
    <section
      id={`plate-calculator-${workoutExerciseId}`}
      className="plate-calculator-panel"
      aria-label={`${exerciseName} plate calculator`}
    >
      <div className="plate-calculator-topline">
        <div>
          <p className="plate-calculator-kicker">Plate Calculator</p>
          <h4 className="plate-calculator-title">{getPlateCalculatorTitle(exerciseType)}</h4>
        </div>
      </div>

      {workoutExercise.sets.length > 1 && (
        <div className="plate-calculator-set-picker" aria-label="Choose set">
          {workoutExercise.sets.map((set, index) => {
            const isSelected = plateCalculatorTarget?.set.id === set.id;

            return (
              <button
                key={set.id}
                type="button"
                className={`plate-calculator-set-button ${isSelected ? "active" : ""}`}
                onClick={() => onSelectPlateCalculatorSet(set.id)}
              >
                <span className="plate-calculator-set-button-label">Set {index + 1}</span>
                <span className="plate-calculator-set-button-value">
                  {set.weight > 0 ? `${formatWeight(set.weight)} lbs` : "No weight"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!plateCalculatorTarget || plateCalculatorTarget.set.weight <= 0 ? (
        <p className="plate-calculator-message">
          Enter a weight on the current set to see the plate stack.
        </p>
      ) : plateLayout?.status === "bar-only" ? (
        <div className="plate-calculator-state">
          <div className="plate-calculator-summary-grid">
            <div className="plate-calculator-stat">
              <span className="plate-calculator-stat-label">Target</span>
              <strong>{formatWeight(plateCalculatorTarget.set.weight)} lbs</strong>
            </div>
            <div className="plate-calculator-stat">
              <span className="plate-calculator-stat-label">Load</span>
              <strong>Bar only</strong>
            </div>
          </div>
          <p className="plate-calculator-message">No plates needed. Just use the empty bar.</p>
        </div>
      ) : plateLayout?.status === "below-bar" ? (
        <div className="plate-calculator-state">
          <div className="plate-calculator-summary-grid">
            <div className="plate-calculator-stat">
              <span className="plate-calculator-stat-label">Target</span>
              <strong>{formatWeight(plateCalculatorTarget.set.weight)} lbs</strong>
            </div>
            <div className="plate-calculator-stat">
              <span className="plate-calculator-stat-label">Closest</span>
              <strong>{STANDARD_BARBELL_WEIGHT} lbs</strong>
            </div>
          </div>
          <p className="plate-calculator-message">
            This is lighter than a standard barbell. The lowest load here is 45 lbs.
          </p>
        </div>
      ) : plateLayout?.status === "unloadable" ? (
        <div className="plate-calculator-state">
          <div className="plate-calculator-summary-grid">
            <div className="plate-calculator-stat">
              <span className="plate-calculator-stat-label">Target</span>
              <strong>{formatWeight(plateCalculatorTarget.set.weight)} lbs</strong>
            </div>
            <div className="plate-calculator-stat">
              <span className="plate-calculator-stat-label">Closest</span>
              <strong>{formatWeight(plateLayout.nearestLoadableWeight)} lbs</strong>
            </div>
          </div>
          <p className="plate-calculator-message">
            Standard plates load in 5 lb jumps. Round to the nearest loadable weight.
          </p>
        </div>
      ) : plateLayout ? (
        <div className="plate-calculator-state">
          <div className="plate-visual" aria-hidden="true">
            <div className="plate-visual-sleeve" />
            <div className="plate-stack plate-stack-left">
              {[...plateLayout.plates].reverse().map((plate, index) => (
                <div
                  key={`left-${plate.weight}-${index}`}
                  className={`plate-visual-plate ${plate.className}`}
                  style={{ width: `${plate.width}px`, height: `${plate.height}px` }}
                >
                  <span
                    className={`plate-visual-label ${plate.width <= 30 ? "compact" : ""}`}
                  >
                    {formatWeight(plate.weight)}
                  </span>
                </div>
              ))}
            </div>
            <div className="plate-visual-collar" />
            <div className="plate-visual-center" />
            <div className="plate-visual-collar" />
            <div className="plate-stack plate-stack-right">
              {plateLayout.plates.map((plate, index) => (
                <div
                  key={`right-${plate.weight}-${index}`}
                  className={`plate-visual-plate ${plate.className}`}
                  style={{ width: `${plate.width}px`, height: `${plate.height}px` }}
                >
                  <span
                    className={`plate-visual-label ${plate.width <= 30 ? "compact" : ""}`}
                  >
                    {formatWeight(plate.weight)}
                  </span>
                </div>
              ))}
            </div>
            <div className="plate-visual-sleeve" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Renders one workout exercise card while delegating state ownership to WorkoutPage.
 */
export function WorkoutExerciseCard({
  workoutExercise,
  exercise,
  allWorkoutExercises,
  exerciseLookup,
  exerciseIndex,
  totalExerciseCount,
  lastPerformedSets,
  supersetDisplayLabels,
  isKebabMenuOpen,
  isIntensityEditorOpen,
  isPlateCalculatorOpen,
  isNoteEditorOpen,
  selectedPlateCalculatorSetId,
  onViewHistory,
  onToggleKebabMenu,
  onToggleIntensityEditor,
  onTogglePlateCalculator,
  onSelectPlateCalculatorSet,
  onStartEditingNote,
  onStopEditingNote,
  onChangeNote,
  onDeleteNote,
  onSkipRemainingSets,
  onMoveExercise,
  onReplaceExercise,
  onDeleteExercise,
  onSetIntensityTechnique,
  onSetSupersetPartner,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
}: WorkoutExerciseCardProps): React.ReactElement {
  const canMoveUp = exerciseIndex > 0;
  const canMoveDown = exerciseIndex < totalExerciseCount - 1;
  const supportsPlateCalculator = canUsePlateCalculator(exercise.exerciseType);
  const defaultPlateCalculatorTarget = getPlateCalculatorTarget(workoutExercise);
  const hasExerciseNote = exercise.notes !== "";
  const hasIncompleteSets = workoutExercise.sets.some((set) => !set.completed && !set.skipped);
  const supersetPartnerId = getSupersetPartnerId(allWorkoutExercises, workoutExercise.id);
  const supersetPartnerWorkoutExercise = supersetPartnerId
    ? allWorkoutExercises.find((item) => item.id === supersetPartnerId)
    : undefined;
  const supersetPartnerExercise = supersetPartnerWorkoutExercise
    ? exerciseLookup.get(supersetPartnerWorkoutExercise.exerciseId)
    : undefined;
  const supersetLabel = workoutExercise.supersetGroupId
    ? supersetDisplayLabels[workoutExercise.supersetGroupId]
    : null;
  const techniqueLabel = getWorkoutTechniqueLabel(
    workoutExercise,
    supersetLabel,
    intensityTechniqueLabels
  );

  return (
    <div className="workout-exercise-card card">
      <div className="workout-exercise-header">
        <div>
          <div className="exercise-meta-row">
            <Tag muscleGroup={exercise.muscleGroup}>{muscleGroupLabels[exercise.muscleGroup]}</Tag>
            <Tag>{exerciseTypeLabels[exercise.exerciseType]}</Tag>
            <div className="workout-technique-editor">
              <button
                type="button"
                className={`workout-technique-trigger tag ${workoutExercise.intensityTechnique ? "tag-accent" : "tag-muted"} ${isIntensityEditorOpen ? "active" : ""}`}
                onClick={onToggleIntensityEditor}
                aria-label={`Edit intensity technique for ${exercise.name}`}
                aria-expanded={isIntensityEditorOpen}
                aria-controls={`workout-technique-editor-${workoutExercise.id}`}
              >
                {techniqueLabel}
              </button>
            </div>
          </div>
          <div className="exercise-name-row">
            <h3 className="workout-exercise-name clickable" onClick={onViewHistory}>
              {exercise.name}
            </h3>
          </div>
        </div>
        <div className="workout-exercise-actions">
          <button
            className="btn btn-icon btn-ghost"
            onClick={onToggleKebabMenu}
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
          {isKebabMenuOpen && (
            <div className="kebab-menu">
              {supportsPlateCalculator && (
                <button
                  className="kebab-menu-item"
                  onClick={() => onTogglePlateCalculator(defaultPlateCalculatorTarget?.set.id)}
                  aria-expanded={isPlateCalculatorOpen}
                  aria-controls={`plate-calculator-${workoutExercise.id}`}
                >
                  <Dumbbell size={16} />
                  Plate Calculator
                </button>
              )}
              {hasExerciseNote ? (
                <button className="kebab-menu-item" onClick={onDeleteNote}>
                  <Trash2 size={16} />
                  Delete Note
                </button>
              ) : (
                <button className="kebab-menu-item" onClick={onStartEditingNote}>
                  <StickyNote size={16} />
                  Add Note
                </button>
              )}
              {hasIncompleteSets && (
                <button className="kebab-menu-item" onClick={onSkipRemainingSets}>
                  <SkipForward size={16} />
                  Skip Remaining Sets
                </button>
              )}
              <button
                className="kebab-menu-item"
                onClick={() => onMoveExercise("up")}
                disabled={!canMoveUp}
              >
                <ChevronUp size={16} />
                Move Up
              </button>
              <button
                className="kebab-menu-item"
                onClick={() => onMoveExercise("down")}
                disabled={!canMoveDown}
              >
                <ChevronDown size={16} />
                Move Down
              </button>
              <button className="kebab-menu-item" onClick={onReplaceExercise}>
                <ArrowLeftRight size={16} />
                Replace Exercise
              </button>
              <button className="kebab-menu-item kebab-menu-item-danger" onClick={onDeleteExercise}>
                <Trash2 size={16} />
                Delete Exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {(hasExerciseNote || isNoteEditorOpen) && (
        <div className="workout-exercise-note-section">
          {isNoteEditorOpen ? (
            <textarea
              className="workout-exercise-note-input"
              value={exercise.notes}
              onChange={(event) => onChangeNote(event.target.value)}
              onBlur={onStopEditingNote}
              placeholder="Add notes..."
              autoFocus
            />
          ) : (
            <div className="workout-exercise-note" onClick={onStartEditingNote}>
              <Edit3 size={16} className="note-edit-icon" />
              <span>{exercise.notes || "Add notes..."}</span>
            </div>
          )}
        </div>
      )}

      {workoutExercise.intensityTechnique === "super-set" && (
        <p className="workout-technique-summary">
          {supersetPartnerExercise
            ? `Paired with ${supersetPartnerExercise.name}`
            : "Choose a paired exercise"}
        </p>
      )}

      {isIntensityEditorOpen && (
        <div
          id={`workout-technique-editor-${workoutExercise.id}`}
          className="workout-technique-editor workout-technique-panel"
          aria-label={`Intensity technique for ${exercise.name}`}
        >
          <div className="workout-technique-options">
            <button
              type="button"
              className={`workout-technique-option ${workoutExercise.intensityTechnique === null ? "active" : ""}`}
              onClick={() => onSetIntensityTechnique(null)}
            >
              Standard
            </button>
            {INTENSITY_TECHNIQUES.map((technique) => (
              <button
                key={technique}
                type="button"
                className={`workout-technique-option ${workoutExercise.intensityTechnique === technique ? "active" : ""}`}
                onClick={() => onSetIntensityTechnique(technique)}
              >
                {intensityTechniqueLabels[technique]}
              </button>
            ))}
          </div>

          {workoutExercise.intensityTechnique === "super-set" && (
            <label className="workout-technique-pairing">
              <span className="workout-intensity-label">Paired with</span>
              <select
                aria-label={`Superset pair for ${exercise.name}`}
                value={supersetPartnerId ?? ""}
                onChange={(event) => onSetSupersetPartner(event.target.value)}
              >
                <option value="">Select exercise</option>
                {allWorkoutExercises
                  .filter((partner) => partner.id !== workoutExercise.id)
                  .map((partner) => {
                    const partnerExercise = exerciseLookup.get(partner.exerciseId);

                    if (!partnerExercise) {
                      return null;
                    }

                    return (
                      <option key={partner.id} value={partner.id}>
                        {partnerExercise.name}
                      </option>
                    );
                  })}
              </select>
            </label>
          )}
        </div>
      )}

      {supportsPlateCalculator && isPlateCalculatorOpen && (
        <WorkoutPlateCalculatorPanel
          workoutExerciseId={workoutExercise.id}
          exerciseName={exercise.name}
          exerciseType={exercise.exerciseType}
          workoutExercise={workoutExercise}
          selectedPlateCalculatorSetId={selectedPlateCalculatorSetId}
          onSelectPlateCalculatorSet={onSelectPlateCalculatorSet}
        />
      )}

      <div className="sets-container">
        <div
          className={`sets-header ${exercise.exerciseType === "bodyweight" ? "bodyweight" : ""}`}
        >
          <span className="set-col-num"></span>
          {exercise.exerciseType !== "bodyweight" && (
            <span className="set-col-weight text-uppercase">Weight</span>
          )}
          <span className="set-col-reps text-uppercase">Reps</span>
          <span className="set-col-done text-uppercase">Log</span>
        </div>
        {workoutExercise.sets.map((set, setIndex) => {
          const lastSet = lastPerformedSets?.[setIndex];

          return (
            <SetRow
              key={set.id}
              set={set}
              onUpdate={(updates) => onUpdateSet(set.id, updates)}
              onRemove={() => onRemoveSet(set.id)}
              canRemove={workoutExercise.sets.length > 1}
              exerciseType={exercise.exerciseType}
              placeholderWeight={lastSet?.weight}
              placeholderReps={lastSet?.reps}
            />
          );
        })}
      </div>

      <button className="add-set-btn" onClick={onAddSet}>
        <Plus size={16} />
        Add Set
      </button>
    </div>
  );
}
