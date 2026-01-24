/**
 * Puzzle Import/Export Service
 * Handles importing and exporting puzzles in various formats
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ExportFormat, ImportOptions, ExportResult, ImportResult, EditorState } from '../interfaces/editor.interfaces';
import * as JSON5 from 'json5';
import * as xml2js from 'xml2js';
import * as yaml from 'js-yaml';
import * as csv from 'csv-parser';
import * as zlib from 'zlib';

@Injectable()
export class PuzzleImportExportService {
  private readonly logger = new Logger(PuzzleImportExportService.name);

  /**
   * Export puzzle to specified format
   */
  async exportPuzzle(
    editorState: EditorState,
    format: ExportFormat,
    metadata?: Record<string, any>,
  ): Promise<string> {
    try {
      let content: string;

      switch (format.format.toUpperCase()) {
        case 'JSON':
          content = this.exportAsJSON(editorState, format, metadata);
          break;

        case 'XML':
          content = await this.exportAsXML(editorState, format, metadata);
          break;

        case 'YAML':
          content = await this.exportAsYAML(editorState, format, metadata);
          break;

        case 'CSV':
          content = this.exportAsCSV(editorState, format);
          break;

        case 'BINARY':
          return this.exportAsBinary(editorState, format, metadata);

        default:
          throw new BadRequestException(`Unsupported export format: ${format.format}`);
      }

      this.logger.log(`Exported puzzle to ${format.format}`);
      return content;
    } catch (error) {
      this.logger.error(`Failed to export puzzle: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import puzzle from specified format
   */
  async importPuzzle(
    data: string,
    options: ImportOptions,
  ): Promise<EditorState> {
    try {
      let state: EditorState;

      switch (options.format.toUpperCase()) {
        case 'JSON':
          state = this.importFromJSON(data);
          break;

        case 'XML':
          state = await this.importFromXML(data);
          break;

        case 'YAML':
          state = await this.importFromYAML(data);
          break;

        case 'CSV':
          state = await this.importFromCSV(data);
          break;

        case 'BINARY':
          state = this.importFromBinary(data);
          break;

        default:
          throw new BadRequestException(`Unsupported import format: ${options.format}`);
      }

      // Validate if requested
      if (options.validateOnImport) {
        this.validateImportedState(state);
      }

      this.logger.log(`Imported puzzle from ${options.format}`);
      return state;
    } catch (error) {
      this.logger.error(`Failed to import puzzle: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export as JSON
   */
  private exportAsJSON(
    editorState: EditorState,
    format: ExportFormat,
    metadata?: Record<string, any>,
  ): string {
    const exportData: any = {
      version: format.version,
      exportedAt: new Date().toISOString(),
      format: 'JSON',
      puzzle: {
        id: editorState.id,
        components: editorState.components,
        connections: editorState.connections,
        metadata: editorState.metadata,
      },
    };

    if (format.includeMetadata && metadata) {
      exportData.metadata = metadata;
    }

    if (format.includeVersionHistory) {
      exportData.history = editorState.history;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as XML
   */
  private async exportAsXML(
    editorState: EditorState,
    format: ExportFormat,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const builder = new xml2js.Builder({
      rootName: 'puzzle',
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    });

    const obj = {
      version: format.version,
      exportedAt: new Date().toISOString(),
      puzzle: {
        id: editorState.id,
        component: editorState.components,
        connection: editorState.connections,
        metadata: editorState.metadata,
      },
    };

    if (format.includeMetadata && metadata) {
      obj.metadata = metadata;
    }

    return builder.buildObject(obj);
  }

  /**
   * Export as YAML
   */
  private async exportAsYAML(
    editorState: EditorState,
    format: ExportFormat,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const exportData: any = {
      version: format.version,
      exportedAt: new Date().toISOString(),
      puzzle: {
        id: editorState.id,
        components: editorState.components,
        connections: editorState.connections,
        metadata: editorState.metadata,
      },
    };

    if (format.includeMetadata && metadata) {
      exportData.metadata = metadata;
    }

    return yaml.dump(exportData);
  }

  /**
   * Export as CSV
   */
  private exportAsCSV(editorState: EditorState, format: ExportFormat): string {
    const rows: string[] = [];

    // Header
    rows.push('ComponentID,Type,Title,PositionX,PositionY,Width,Height,Properties');

    // Components
    editorState.components.forEach((component) => {
      const props = JSON.stringify(component.properties).replace(/"/g, '""');
      const size = component.size || { width: 0, height: 0 };
      rows.push(
        `"${component.id}","${component.type}","${component.title}",${component.position.x},${component.position.y},${size.width},${size.height},"${props}"`,
      );
    });

    // Add connections section
    rows.push('');
    rows.push('ConnectionID,SourceComponentID,TargetComponentID,Type,Properties');

    editorState.connections.forEach((connection) => {
      const props = JSON.stringify(connection.properties).replace(/"/g, '""');
      rows.push(
        `"${connection.id}","${connection.sourceComponentId}","${connection.targetComponentId}","${connection.connectionType}","${props}"`,
      );
    });

    return rows.join('\n');
  }

  /**
   * Export as Binary (compressed)
   */
  private exportAsBinary(
    editorState: EditorState,
    format: ExportFormat,
    metadata?: Record<string, any>,
  ): string {
    const json = JSON.stringify({
      version: format.version,
      exportedAt: new Date().toISOString(),
      puzzle: editorState,
      metadata: format.includeMetadata ? metadata : null,
    });

    // Compress with zlib
    const compressed = zlib.gzipSync(json);
    return compressed.toString('base64');
  }

  /**
   * Import from JSON
   */
  private importFromJSON(data: string): EditorState {
    try {
      const parsed = JSON5.parse(data);
      return this.normalizeImportedState(parsed.puzzle || parsed);
    } catch (error) {
      throw new BadRequestException(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Import from XML
   */
  private async importFromXML(data: string): Promise<EditorState> {
    try {
      const parser = new xml2js.Parser();
      const parsed = await parser.parseStringPromise(data);

      const puzzle = parsed.puzzle;
      return this.normalizeImportedState({
        id: puzzle.id?.[0],
        components: Array.isArray(puzzle.component) ? puzzle.component : [puzzle.component],
        connections: Array.isArray(puzzle.connection) ? puzzle.connection : [puzzle.connection],
        metadata: puzzle.metadata?.[0],
      });
    } catch (error) {
      throw new BadRequestException(`Invalid XML format: ${error.message}`);
    }
  }

  /**
   * Import from YAML
   */
  private async importFromYAML(data: string): Promise<EditorState> {
    try {
      const parsed = yaml.load(data) as any;
      return this.normalizeImportedState(parsed.puzzle || parsed);
    } catch (error) {
      throw new BadRequestException(`Invalid YAML format: ${error.message}`);
    }
  }

  /**
   * Import from CSV
   */
  private async importFromCSV(data: string): Promise<EditorState> {
    try {
      const lines = data.split('\n');
      const components: any[] = [];
      const connections: any[] = [];

      let section = 'components';
      let headerSkipped = false;

      for (const line of lines) {
        if (!line.trim()) {
          // Empty line indicates section change
          section = 'connections';
          headerSkipped = false;
          continue;
        }

        if (!headerSkipped && (line.includes('ComponentID') || line.includes('ConnectionID'))) {
          headerSkipped = true;
          continue;
        }

        if (section === 'components') {
          const [id, type, title, x, y, width, height, props] = this.parseCSVLine(line);
          components.push({
            id,
            type,
            title,
            position: { x: parseFloat(x), y: parseFloat(y) },
            size: { width: parseFloat(width), height: parseFloat(height) },
            properties: JSON.parse(props),
            zIndex: 0,
            metadata: {},
          });
        } else {
          const [id, source, target, connType, props] = this.parseCSVLine(line);
          connections.push({
            id,
            sourceComponentId: source,
            targetComponentId: target,
            connectionType: connType,
            properties: JSON.parse(props),
            metadata: {},
          });
        }
      }

      return {
        id: `imported_${Date.now()}`,
        components,
        connections,
        history: [],
        historyIndex: 0,
        isDirty: false,
        metadata: { version: '1.0', lastSaved: new Date(), lastModifiedBy: 'system' },
      };
    } catch (error) {
      throw new BadRequestException(`Invalid CSV format: ${error.message}`);
    }
  }

  /**
   * Import from Binary
   */
  private importFromBinary(data: string): EditorState {
    try {
      const buffer = Buffer.from(data, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      const json = decompressed.toString('utf-8');
      const parsed = JSON.parse(json);

      return this.normalizeImportedState(parsed.puzzle || parsed);
    } catch (error) {
      throw new BadRequestException(`Invalid Binary format: ${error.message}`);
    }
  }

  /**
   * Normalize imported state to standard format
   */
  private normalizeImportedState(data: any): EditorState {
    return {
      id: data.id || `imported_${Date.now()}`,
      components: Array.isArray(data.components) ? data.components : [],
      connections: Array.isArray(data.connections) ? data.connections : [],
      history: data.history || [],
      historyIndex: data.historyIndex || 0,
      isDirty: false,
      metadata: data.metadata || { version: '1.0', lastSaved: new Date(), lastModifiedBy: 'import' },
    };
  }

  /**
   * Validate imported state
   */
  private validateImportedState(state: EditorState): void {
    if (!Array.isArray(state.components)) {
      throw new BadRequestException('Invalid state: components must be an array');
    }

    if (!Array.isArray(state.connections)) {
      throw new BadRequestException('Invalid state: connections must be an array');
    }

    // Validate components have required fields
    for (const component of state.components) {
      if (!component.id || !component.type) {
        throw new BadRequestException('Invalid component: missing required id or type');
      }
    }

    // Validate connections reference existing components
    const componentIds = new Set(state.components.map((c) => c.id));
    for (const connection of state.connections) {
      if (!componentIds.has(connection.sourceComponentId) || !componentIds.has(connection.targetComponentId)) {
        throw new BadRequestException('Invalid connection: references non-existent component');
      }
    }
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
