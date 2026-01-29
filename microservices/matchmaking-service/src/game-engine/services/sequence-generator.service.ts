import { Injectable, Logger } from "@nestjs/common"
import { DifficultyLevel } from "../types/puzzle.types"

export interface SequencePattern {
  id: string
  name: string
  type: "arithmetic" | "geometric" | "fibonacci" | "polynomial" | "custom"
  generator: (length: number, difficulty: DifficultyLevel) => number[]
  validator: (sequence: number[]) => boolean
  difficulty: DifficultyLevel
}

export interface GeneratedSequence {
  id: string
  pattern: SequencePattern
  sequence: number[]
  missingIndices: number[]
  solution: number[]
  hints: string[]
  metadata: {
    difficulty: DifficultyLevel
    expectedTime: number
    maxAttempts: number
  }
}

@Injectable()
export class SequenceGeneratorService {
  private readonly logger = new Logger(SequenceGeneratorService.name)
  private readonly patterns = new Map<string, SequencePattern>()

  constructor() {
    this.initializeDefaultPatterns()
  }

  registerPattern(pattern: SequencePattern): void {
    this.patterns.set(pattern.id, pattern)
    this.logger.log(`Registered sequence pattern: ${pattern.name}`)
  }

  generateSequence(difficulty: DifficultyLevel, length = 10, patternType?: string): GeneratedSequence {
    try {
      // Select appropriate pattern
      const pattern = this.selectPattern(difficulty, patternType)
      if (!pattern) {
        throw new Error(`No suitable pattern found for difficulty ${difficulty}`)
      }

      // Generate base sequence
      const fullSequence = pattern.generator(length, difficulty)

      // Determine missing elements based on difficulty
      const missingCount = this.calculateMissingCount(difficulty, length)
      const missingIndices = this.selectMissingIndices(length, missingCount, difficulty)

      // Create sequence with missing elements
      const sequence = [...fullSequence]
      const solution: number[] = []

      for (const index of missingIndices) {
        solution.push(fullSequence[index])
        sequence[index] = Number.NaN // Mark as missing
      }

      // Generate hints
      const hints = this.generateHints(pattern, fullSequence, missingIndices, difficulty)

      const generatedSequence: GeneratedSequence = {
        id: `seq-${pattern.id}-${Date.now()}`,
        pattern,
        sequence,
        missingIndices,
        solution,
        hints,
        metadata: {
          difficulty,
          expectedTime: this.calculateExpectedTime(difficulty, missingCount),
          maxAttempts: this.calculateMaxAttempts(difficulty),
        },
      }

      this.logger.debug(`Generated sequence with pattern ${pattern.name}`, {
        difficulty,
        length,
        missingCount,
        patternType: pattern.type,
      })

      return generatedSequence
    } catch (error) {
      this.logger.error("Error generating sequence:", error)
      throw error
    }
  }

  validateSequenceSolution(generatedSequence: GeneratedSequence, userSolution: number[]): boolean {
    try {
      if (userSolution.length !== generatedSequence.solution.length) {
        return false
      }

      // Check each missing element
      for (let i = 0; i < userSolution.length; i++) {
        if (Math.abs(userSolution[i] - generatedSequence.solution[i]) > 0.001) {
          return false
        }
      }

      // Validate the complete sequence follows the pattern
      const completeSequence = [...generatedSequence.sequence]
      for (let i = 0; i < generatedSequence.missingIndices.length; i++) {
        const index = generatedSequence.missingIndices[i]
        completeSequence[index] = userSolution[i]
      }

      return generatedSequence.pattern.validator(completeSequence)
    } catch (error) {
      this.logger.error("Error validating sequence solution:", error)
      return false
    }
  }

  getPatternHint(generatedSequence: GeneratedSequence, hintLevel: number): string {
    const hints = generatedSequence.hints
    const clampedLevel = Math.min(Math.max(hintLevel, 1), hints.length)
    return hints[clampedLevel - 1] || "No more hints available"
  }

  private selectPattern(difficulty: DifficultyLevel, patternType?: string): SequencePattern | null {
    const availablePatterns = Array.from(this.patterns.values()).filter((pattern) => {
      const difficultyMatch = Math.abs(pattern.difficulty - difficulty) <= 1
      const typeMatch = !patternType || pattern.type === patternType
      return difficultyMatch && typeMatch
    })

    if (availablePatterns.length === 0) {
      return null
    }

    // Select random pattern from available options
    return availablePatterns[Math.floor(Math.random() * availablePatterns.length)]
  }

  private calculateMissingCount(difficulty: DifficultyLevel, length: number): number {
    const basePercentage = 0.2 + (difficulty - 1) * 0.1 // 20% to 90%
    const missingCount = Math.round(length * basePercentage)
    return Math.min(Math.max(missingCount, 1), length - 2) // At least 1, at most length-2
  }

  private selectMissingIndices(length: number, count: number, difficulty: DifficultyLevel): number[] {
    const indices: number[] = []
    const availableIndices = Array.from({ length }, (_, i) => i)

    // For easier difficulties, avoid first and last elements
    if (difficulty <= 3) {
      availableIndices.splice(0, 1) // Remove first
      availableIndices.splice(-1, 1) // Remove last
    }

    // Randomly select indices
    for (let i = 0; i < count && availableIndices.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length)
      const selectedIndex = availableIndices.splice(randomIndex, 1)[0]
      indices.push(selectedIndex)
    }

    return indices.sort((a, b) => a - b)
  }

  private generateHints(
    pattern: SequencePattern,
    sequence: number[],
    missingIndices: number[],
    difficulty: DifficultyLevel,
  ): string[] {
    const hints: string[] = []

    // Pattern type hint
    hints.push(`This sequence follows a ${pattern.type} pattern`)

    // Specific pattern hints based on type
    switch (pattern.type) {
      case "arithmetic":
        if (sequence.length >= 2) {
          const diff = sequence[1] - sequence[0]
          hints.push(`Look for a constant difference between consecutive terms`)
          if (difficulty <= 4) {
            hints.push(`The common difference is ${diff}`)
          }
        }
        break

      case "geometric":
        if (sequence.length >= 2 && sequence[0] !== 0) {
          const ratio = sequence[1] / sequence[0]
          hints.push(`Look for a constant ratio between consecutive terms`)
          if (difficulty <= 4) {
            hints.push(`The common ratio is ${ratio}`)
          }
        }
        break

      case "fibonacci":
        hints.push(`Each term is the sum of the two preceding terms`)
        if (difficulty <= 3) {
          hints.push(`Start with the first two terms and add them to get the third`)
        }
        break

      case "polynomial":
        hints.push(`The differences between consecutive terms follow a pattern`)
        hints.push(`Try calculating the first and second differences`)
        break

      case "custom":
        hints.push(`Look for a unique mathematical relationship`)
        break
    }

    // Position-specific hints for higher difficulties
    if (difficulty >= 5 && missingIndices.length > 0) {
      const firstMissing = missingIndices[0]
      if (firstMissing > 0 && firstMissing < sequence.length - 1) {
        hints.push(
          `Focus on the relationship between positions ${firstMissing - 1}, ${firstMissing}, and ${firstMissing + 1}`,
        )
      }
    }

    return hints
  }

  private calculateExpectedTime(difficulty: DifficultyLevel, missingCount: number): number {
    const baseTime = 60000 // 1 minute
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.3
    const countMultiplier = 1 + missingCount * 0.2
    return Math.round(baseTime * difficultyMultiplier * countMultiplier)
  }

  private calculateMaxAttempts(difficulty: DifficultyLevel): number {
    return Math.max(3, 8 - difficulty) // 3-7 attempts based on difficulty
  }

  private initializeDefaultPatterns(): void {
    // Arithmetic sequence
    this.registerPattern({
      id: "arithmetic",
      name: "Arithmetic Sequence",
      type: "arithmetic",
      difficulty: DifficultyLevel.EASY,
      generator: (length, difficulty) => {
        const start = Math.floor(Math.random() * 20) + 1
        const diff = Math.floor(Math.random() * 10) + 1
        const sequence: number[] = []

        for (let i = 0; i < length; i++) {
          sequence.push(start + i * diff)
        }

        return sequence
      },
      validator: (sequence) => {
        if (sequence.length < 2) return true
        const diff = sequence[1] - sequence[0]
        for (let i = 2; i < sequence.length; i++) {
          if (Math.abs(sequence[i] - sequence[i - 1] - diff) > 0.001) {
            return false
          }
        }
        return true
      },
    })

    // Geometric sequence
    this.registerPattern({
      id: "geometric",
      name: "Geometric Sequence",
      type: "geometric",
      difficulty: DifficultyLevel.MEDIUM,
      generator: (length, difficulty) => {
        const start = Math.floor(Math.random() * 10) + 1
        const ratio = Math.random() * 3 + 0.5 // 0.5 to 3.5
        const sequence: number[] = []

        for (let i = 0; i < length; i++) {
          sequence.push(Math.round(start * Math.pow(ratio, i) * 100) / 100)
        }

        return sequence
      },
      validator: (sequence) => {
        if (sequence.length < 2 || sequence[0] === 0) return true
        const ratio = sequence[1] / sequence[0]
        for (let i = 2; i < sequence.length; i++) {
          if (sequence[i - 1] === 0) return false
          if (Math.abs(sequence[i] / sequence[i - 1] - ratio) > 0.01) {
            return false
          }
        }
        return true
      },
    })

    // Fibonacci sequence
    this.registerPattern({
      id: "fibonacci",
      name: "Fibonacci Sequence",
      type: "fibonacci",
      difficulty: DifficultyLevel.MEDIUM,
      generator: (length, difficulty) => {
        const sequence: number[] = []
        if (length >= 1) sequence.push(1)
        if (length >= 2) sequence.push(1)

        for (let i = 2; i < length; i++) {
          sequence.push(sequence[i - 1] + sequence[i - 2])
        }

        return sequence
      },
      validator: (sequence) => {
        if (sequence.length < 3) return true
        for (let i = 2; i < sequence.length; i++) {
          if (Math.abs(sequence[i] - (sequence[i - 1] + sequence[i - 2])) > 0.001) {
            return false
          }
        }
        return true
      },
    })

    // Quadratic sequence
    this.registerPattern({
      id: "quadratic",
      name: "Quadratic Sequence",
      type: "polynomial",
      difficulty: DifficultyLevel.HARD,
      generator: (length, difficulty) => {
        const a = Math.floor(Math.random() * 5) + 1
        const b = Math.floor(Math.random() * 10) - 5
        const c = Math.floor(Math.random() * 10) + 1
        const sequence: number[] = []

        for (let i = 1; i <= length; i++) {
          sequence.push(a * i * i + b * i + c)
        }

        return sequence
      },
      validator: (sequence) => {
        if (sequence.length < 3) return true

        // Check if second differences are constant
        const firstDiffs: number[] = []
        for (let i = 1; i < sequence.length; i++) {
          firstDiffs.push(sequence[i] - sequence[i - 1])
        }

        if (firstDiffs.length < 2) return true

        const secondDiffs: number[] = []
        for (let i = 1; i < firstDiffs.length; i++) {
          secondDiffs.push(firstDiffs[i] - firstDiffs[i - 1])
        }

        const expectedSecondDiff = secondDiffs[0]
        for (let i = 1; i < secondDiffs.length; i++) {
          if (Math.abs(secondDiffs[i] - expectedSecondDiff) > 0.001) {
            return false
          }
        }

        return true
      },
    })

    // Powers of 2
    this.registerPattern({
      id: "powers-of-2",
      name: "Powers of 2",
      type: "geometric",
      difficulty: DifficultyLevel.EASY,
      generator: (length, difficulty) => {
        const sequence: number[] = []
        for (let i = 0; i < length; i++) {
          sequence.push(Math.pow(2, i))
        }
        return sequence
      },
      validator: (sequence) => {
        for (let i = 0; i < sequence.length; i++) {
          if (Math.abs(sequence[i] - Math.pow(2, i)) > 0.001) {
            return false
          }
        }
        return true
      },
    })

    // Prime numbers
    this.registerPattern({
      id: "primes",
      name: "Prime Numbers",
      type: "custom",
      difficulty: DifficultyLevel.EXPERT,
      generator: (length, difficulty) => {
        const primes = this.generatePrimes(length * 3) // Generate more than needed
        return primes.slice(0, length)
      },
      validator: (sequence) => {
        for (const num of sequence) {
          if (!this.isPrime(num)) {
            return false
          }
        }
        return true
      },
    })

    this.logger.log("Initialized default sequence patterns")
  }

  private generatePrimes(limit: number): number[] {
    const primes: number[] = []
    const isPrime = new Array(limit + 1).fill(true)
    isPrime[0] = isPrime[1] = false

    for (let i = 2; i <= limit; i++) {
      if (isPrime[i]) {
        primes.push(i)
        for (let j = i * i; j <= limit; j += i) {
          isPrime[j] = false
        }
      }
    }

    return primes
  }

  private isPrime(n: number): boolean {
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false

    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false
    }

    return true
  }
}
