/**
 * Puzzle Validation Service
 * Validates puzzle components, constraints, and overall puzzle integrity
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  EditorComponent,
  RuleType,
  ComponentType,
} from '../interfaces/editor.interfaces';

@Injectable()
export class PuzzleValidationService {
  private readonly logger = new Logger(PuzzleValidationService.name);

  /**
   * Validate complete puzzle state
   */
  async validatePuzzle(
    components: EditorComponent[],
    connections: any[],
    constraints: any[] = [],
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Validate components
    for (const component of components) {
      const componentErrors = await this.validateComponent(component);
      errors.push(...componentErrors);

      const componentWarnings = await this.checkComponentWarnings(component);
      warnings.push(...componentWarnings);
    }

    // Validate connections
    const connectionErrors = await this.validateConnections(components, connections);
    errors.push(...connectionErrors);

    // Validate constraints
    const constraintErrors = await this.validateConstraints(components, constraints);
    errors.push(...constraintErrors);

    // Check for common issues
    const commonIssues = await this.checkCommonIssues(components, connections);
    warnings.push(...commonIssues);

    // Generate suggestions
    const puzzleSuggestions = await this.generateSuggestions(components, connections, errors, warnings);
    suggestions.push(...puzzleSuggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      timestamp: new Date(),
    };
  }

  /**
   * Validate individual component
   */
  private async validateComponent(component: EditorComponent): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check required properties
    if (!component.id) {
      errors.push({
        id: `comp_id_missing_${component.id}`,
        componentId: component.id,
        message: 'Component must have a unique ID',
        severity: 'error',
      });
    }

    if (!component.type) {
      errors.push({
        id: `comp_type_missing_${component.id}`,
        componentId: component.id,
        message: 'Component must have a type',
        severity: 'error',
      });
    }

    if (!component.title || component.title.trim().length === 0) {
      errors.push({
        id: `comp_title_missing_${component.id}`,
        componentId: component.id,
        message: 'Component must have a title',
        severity: 'error',
      });
    }

    // Validate position
    if (!component.position || typeof component.position.x !== 'number' || typeof component.position.y !== 'number') {
      errors.push({
        id: `comp_position_invalid_${component.id}`,
        componentId: component.id,
        message: 'Component must have valid position (x, y)',
        severity: 'error',
      });
    }

    // Validate size if present
    if (component.size) {
      if (component.size.width <= 0 || component.size.height <= 0) {
        errors.push({
          id: `comp_size_invalid_${component.id}`,
          componentId: component.id,
          message: 'Component size must be greater than 0',
          severity: 'error',
        });
      }
    }

    // Type-specific validation
    const typeErrors = await this.validateComponentType(component);
    errors.push(...typeErrors);

    // Validate component constraints
    if (component.metadata?.constraints) {
      const constraintErrors = await this.validateComponentConstraints(component);
      errors.push(...constraintErrors);
    }

    return errors;
  }

  /**
   * Validate component type-specific rules
   */
  private async validateComponentType(component: EditorComponent): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    switch (component.type) {
      case 'GRID_CELL':
      case 'GRID_ROW':
      case 'GRID_COLUMN':
        if (!component.properties.gridSize) {
          errors.push({
            id: `grid_size_missing_${component.id}`,
            componentId: component.id,
            message: 'Grid component must have a gridSize property',
            severity: 'error',
          });
        }
        break;

      case 'CONSTRAINT':
      case 'RULE':
        if (!component.properties.condition) {
          errors.push({
            id: `rule_condition_missing_${component.id}`,
            componentId: component.id,
            message: 'Rule component must have a condition property',
            severity: 'error',
          });
        }
        break;

      case 'SEQUENCE_ELEMENT':
      case 'PATTERN_ELEMENT':
        if (component.properties.value === undefined && component.properties.pattern === undefined) {
          errors.push({
            id: `sequence_value_missing_${component.id}`,
            componentId: component.id,
            message: 'Sequence component must have a value or pattern',
            severity: 'error',
          });
        }
        break;

      case 'SPATIAL_TARGET':
        if (!component.properties.targetLocation) {
          errors.push({
            id: `spatial_target_missing_${component.id}`,
            componentId: component.id,
            message: 'Spatial target must have a target location',
            severity: 'error',
          });
        }
        break;

      case 'TEXT_INPUT':
        if (!component.properties.placeholder && !component.properties.label) {
          errors.push({
            id: `input_label_missing_${component.id}`,
            componentId: component.id,
            message: 'Text input should have a placeholder or label',
            severity: 'error',
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Validate component constraints
   */
  private async validateComponentConstraints(component: EditorComponent): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const constraints = component.metadata?.constraints || [];

    for (const constraint of constraints) {
      if (!constraint.condition || !constraint.errorMessage) {
        errors.push({
          id: `constraint_incomplete_${component.id}_${constraint.id}`,
          componentId: component.id,
          message: `Constraint ${constraint.id} is incomplete`,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Validate connections between components
   */
  private async validateConnections(
    components: EditorComponent[],
    connections: any[],
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const componentIds = new Set(components.map((c) => c.id));

    for (const connection of connections) {
      // Check if source and target exist
      if (!componentIds.has(connection.sourceComponentId)) {
        errors.push({
          id: `conn_source_missing_${connection.id}`,
          message: `Connection references non-existent source component: ${connection.sourceComponentId}`,
          severity: 'error',
        });
      }

      if (!componentIds.has(connection.targetComponentId)) {
        errors.push({
          id: `conn_target_missing_${connection.id}`,
          message: `Connection references non-existent target component: ${connection.targetComponentId}`,
          severity: 'error',
        });
      }

      // Check for self-loops where not allowed
      if (connection.sourceComponentId === connection.targetComponentId && !connection.properties?.allowSelfLoop) {
        errors.push({
          id: `conn_self_loop_${connection.id}`,
          message: `Connection cannot reference the same component on both ends`,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Validate puzzle constraints
   */
  private async validateConstraints(components: EditorComponent[], constraints: any[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const constraint of constraints) {
      if (!constraint.condition) {
        errors.push({
          id: `constraint_no_condition_${constraint.id}`,
          message: `Constraint must have a condition`,
          severity: 'error',
        });
      }

      if (!constraint.errorMessage) {
        errors.push({
          id: `constraint_no_message_${constraint.id}`,
          message: `Constraint must have an error message`,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Check component for warnings
   */
  private async checkComponentWarnings(component: EditorComponent): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // Check for missing descriptions
    if (!component.metadata?.description) {
      warnings.push({
        id: `comp_desc_missing_${component.id}`,
        componentId: component.id,
        message: 'Component should have a description for clarity',
        code: 'MISSING_DESCRIPTION',
      });
    }

    // Check for unused components
    if (!component.metadata?.linkedComponents || component.metadata.linkedComponents.length === 0) {
      warnings.push({
        id: `comp_unused_${component.id}`,
        componentId: component.id,
        message: 'Component is not linked to any other component',
        code: 'UNUSED_COMPONENT',
      });
    }

    // Check for very long titles
    if (component.title.length > 100) {
      warnings.push({
        id: `comp_long_title_${component.id}`,
        componentId: component.id,
        message: 'Component title is very long and may be truncated in UI',
        code: 'LONG_TITLE',
      });
    }

    return warnings;
  }

  /**
   * Check for common puzzle design issues
   */
  private async checkCommonIssues(components: EditorComponent[], connections: any[]): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // Check for isolated component groups
    const componentGraph = this.buildComponentGraph(components, connections);
    const connectedGroups = this.findConnectedComponents(componentGraph);

    if (connectedGroups.length > 1) {
      warnings.push({
        id: 'isolated_components',
        message: `Puzzle has ${connectedGroups.length} isolated component groups. Consider connecting them.`,
        code: 'ISOLATED_COMPONENTS',
      });
    }

    // Check for circular dependencies
    if (this.hasCyclicDependencies(componentGraph)) {
      warnings.push({
        id: 'cyclic_dependencies',
        message: 'Puzzle has circular dependencies that may cause logic issues',
        code: 'CYCLIC_DEPENDENCIES',
      });
    }

    // Check for missing entry/exit points
    const hasInput = components.some(
      (c) => c.type === 'BUTTON' || c.type === 'TEXT_INPUT' || c.type === 'RADIO_GROUP' || c.type === 'DROPDOWN',
    );
    const hasOutput = components.some(
      (c) => c.type === 'SPATIAL_TARGET' || c.type === 'HINT_BOX' || c.metadata?.isSuccessState,
    );

    if (!hasInput) {
      warnings.push({
        id: 'no_input_components',
        message: 'Puzzle has no input components. Players may not be able to interact with it.',
        code: 'NO_INPUT_COMPONENTS',
      });
    }

    if (!hasOutput) {
      warnings.push({
        id: 'no_output_components',
        message: 'Puzzle has no output components. Players may not know when they succeed.',
        code: 'NO_OUTPUT_COMPONENTS',
      });
    }

    return warnings;
  }

  /**
   * Generate suggestions for improvement
   */
  private async generateSuggestions(
    components: EditorComponent[],
    connections: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];

    // If there are errors, suggest auto-fix
    if (errors.length > 0) {
      suggestions.push({
        id: 'auto_fix_errors',
        message: 'Auto-fix available errors?',
        action: async () => {
          // Will be implemented by editor
        },
        priority: 'high',
      });
    }

    // Suggest adding descriptions
    const componentsWithoutDescription = components.filter(
      (c) => !c.metadata?.description,
    );
    if (componentsWithoutDescription.length > 0) {
      suggestions.push({
        id: 'add_descriptions',
        message: `Add descriptions to ${componentsWithoutDescription.length} components for better clarity`,
        action: async () => {
          // Will be implemented by editor
        },
        priority: 'medium',
      });
    }

    // Suggest adding tags
    if (components.length > 5 && !components.some((c) => c.metadata?.tags?.length)) {
      suggestions.push({
        id: 'add_tags',
        message: 'Consider adding tags to components for better organization',
        action: async () => {
          // Will be implemented by editor
        },
        priority: 'low',
      });
    }

    return suggestions;
  }

  /**
   * Build a graph of component connections
   */
  private buildComponentGraph(components: EditorComponent[], connections: any[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    // Initialize with all components
    for (const component of components) {
      graph.set(component.id, new Set());
    }

    // Add connections
    for (const connection of connections) {
      if (graph.has(connection.sourceComponentId) && graph.has(connection.targetComponentId)) {
        graph.get(connection.sourceComponentId)!.add(connection.targetComponentId);
      }
    }

    return graph;
  }

  /**
   * Find connected components using BFS/DFS
   */
  private findConnectedComponents(graph: Map<string, Set<string>>): Set<string>[] {
    const visited = new Set<string>();
    const groups: Set<string>[] = [];

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        const group = new Set<string>();
        this.dfs(node, graph, visited, group);
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Depth-first search for connected components
   */
  private dfs(node: string, graph: Map<string, Set<string>>, visited: Set<string>, group: Set<string>) {
    visited.add(node);
    group.add(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        this.dfs(neighbor, graph, visited, group);
      }
    }
  }

  /**
   * Check for cyclic dependencies
   */
  private hasCyclicDependencies(graph: Map<string, Set<string>>): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (this.hasCycle(node, graph, visited, recursionStack)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * DFS-based cycle detection
   */
  private hasCycle(node: string, graph: Map<string, Set<string>>, visited: Set<string>, stack: Set<string>): boolean {
    visited.add(node);
    stack.add(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        if (this.hasCycle(neighbor, graph, visited, stack)) {
          return true;
        }
      } else if (stack.has(neighbor)) {
        return true;
      }
    }

    stack.delete(node);
    return false;
  }

  /**
   * Apply automatic fixes to component
   */
  async autoFixComponent(component: EditorComponent): Promise<EditorComponent> {
    const fixed = { ...component };

    // Auto-generate ID if missing
    if (!fixed.id) {
      fixed.id = `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set default type if missing
    if (!fixed.type) {
      fixed.type = ComponentType.PANEL;
    }

    // Ensure position is valid
    if (!fixed.position) {
      fixed.position = { x: 0, y: 0 };
    }

    // Ensure zIndex exists
    if (!fixed.zIndex) {
      fixed.zIndex = 0;
    }

    // Ensure metadata exists
    if (!fixed.metadata) {
      fixed.metadata = {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      };
    }

    return fixed;
  }
}
